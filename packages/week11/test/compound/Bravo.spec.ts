import { loadFixture, time, mineUpTo } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import Bignumber from 'bignumber.js';

import {
	deployBravo,
	deployComp,
	deployCompoundWithOneMarket,
	timelockExecuteTransaction,
} from './setup';
import { DECIMAL } from './utils';

describe('Bravo', function () {
	// We define a fixture to reuse the same setup in every test.
	// We use loadFixture to run this setup once, snapshot that state,
	// and reset Hardhat Network to that snapshot in every test.
	async function deployCompTokenFixture() {
		const [owner, ...otherAccount] = await ethers.getSigners();

		const comp = await deployComp(owner);

		return { owner, otherAccount, comp };
	}

	async function deployBravoFixture() {
		// Contracts are deployed using the first signer/account by default
		const [owner, ...otherAccount] = await ethers.getSigners();

		const { timelock, governorBravoProxy, governorAlpha, comp } = await deployBravo(owner);

		const abi = new ethers.utils.AbiCoder();

		// Setup timelock admin can be called by bravo
		await timelockExecuteTransaction(
			timelock,
			timelock.address,
			0,
			'setPendingAdmin(address)',
			abi.encode(['address'], [governorBravoProxy.address]),
		);

		// Setup timelock admin as governorBravoProxy
		await governorBravoProxy._initiate(governorAlpha.address);

		return {
			owner,
			otherAccount,
			governorBravoProxy,
			comp,
			timelock,
		};
	}

	describe('Deployment', function () {
		it('Should set the right admin', async function () {
			const { owner, governorBravoProxy, timelock } = await loadFixture(deployBravoFixture);

			expect(await governorBravoProxy.admin()).to.equal(owner.address);
			expect(await timelock.admin()).to.equal(governorBravoProxy.address);
		});

		it('Should have Comp', async function () {
			const { owner, comp } = await loadFixture(deployCompTokenFixture);
			const balance = await comp.balanceOf(owner.address);

			expect(balance).to.equal(10_000_000n * DECIMAL);
		});
	});

	describe('Config unitroller with proposol', function () {
		async function setupUnitrollerWIthBravoFixture() {
			const [owner, ...otherAccount] = await ethers.getSigners();

			const bravo = await deployBravo(owner);

			const compound = await deployCompoundWithOneMarket(owner);

			// Setup Timelock with admin
			await compound.unitrollerContract._setPendingAdmin(bravo.timelock.address);

			// Trigger Timlock accept admin
			await timelockExecuteTransaction(
				bravo.timelock,
				compound.unitrollerContract.address,
				0,
				'',
				ethers.utils.id('_acceptAdmin()').substring(0, 10),
			);

			const abi = new ethers.utils.AbiCoder();

			// Setup timelock admin can be called by bravo
			await timelockExecuteTransaction(
				bravo.timelock,
				bravo.timelock.address,
				0,
				'setPendingAdmin(address)',
				abi.encode(['address'], [bravo.governorBravoProxy.address]),
			);

			await bravo.governorBravoProxy._initiate(bravo.governorAlpha.address);

			// Setup owner vote
			await bravo.comp.delegate(owner.address);

			// Setup voterA vote
			const voterA = otherAccount[0];
			await bravo.comp.transfer(voterA.address, 1001n * DECIMAL);

			// voterA get votes
			await bravo.comp.connect(voterA).delegate(voterA.address);

			return { ...bravo, ...compound, owner, voterA };
		}

		it('Should set the unitrollerProxy admin as Timelock', async function () {
			const { timelock, unitrollerProxy } = await loadFixture(setupUnitrollerWIthBravoFixture);

			expect(await unitrollerProxy.admin()).to.equal(timelock.address);
		});

		it('Should has votes by owner', async function () {
			const { owner, comp } = await loadFixture(setupUnitrollerWIthBravoFixture);

			const votes = await comp.getCurrentVotes(owner.address);

			expect(votes).to.gt(0);
		});

		it('Should has votes == balances', async function () {
			const { voterA, comp } = await loadFixture(setupUnitrollerWIthBravoFixture);

			const votes = await comp.getCurrentVotes(voterA.address);
			const balances = await comp.balanceOf(voterA.address);

			expect(votes).to.equal(balances);
		});

		it('Should proposal for unitroller setting', async function () {
			const { unitrollerProxy, governorBravoProxy, cErc20TokenA } = await loadFixture(
				setupUnitrollerWIthBravoFixture,
			);

			const COLLATERAL_FACTOR = new Bignumber(0.5).multipliedBy(DECIMAL.toString()).toString();

			const abi = new ethers.utils.AbiCoder();

			await governorBravoProxy.propose(
				[unitrollerProxy.address],
				[0],
				['_setCollateralFactor(address,uint256)'],
				[abi.encode(['address', 'uint256'], [cErc20TokenA.address, COLLATERAL_FACTOR])],
				'',
			);

			const latestBlock = await time.latestBlock();

			// wait MIN_VOTING_DELAY delay block
			await mineUpTo(latestBlock + 2);

			const proposalState = await governorBravoProxy.state(2);

			// Proposal state active
			expect(proposalState).to.equal(1);
		});

		it('Should proposal for unitroller setting with voterA that comp > 1001', async function () {
			const { voterA, unitrollerProxy, governorBravoProxy, cErc20TokenA } = await loadFixture(
				setupUnitrollerWIthBravoFixture,
			);

			// const votes = await comp.getCurrentVotes(voterA.address);
			// const balance = await comp.balanceOf(voterA.address);

			// console.log('votes?', votes, 'balance?', balance);

			const COLLATERAL_FACTOR = new Bignumber(0.5).multipliedBy(DECIMAL.toString()).toString();

			const abi = new ethers.utils.AbiCoder();

			await governorBravoProxy
				.connect(voterA)
				.propose(
					[unitrollerProxy.address],
					[0],
					['_setCollateralFactor(address,uint256)'],
					[abi.encode(['address', 'uint256'], [cErc20TokenA.address, COLLATERAL_FACTOR])],
					'',
				);

			const latestBlock = await time.latestBlock();

			// wait MIN_VOTING_DELAY delay block
			await mineUpTo(latestBlock + 2);

			const proposalState = await governorBravoProxy.state(2);

			expect(proposalState).to.equal(1);
		});

		describe('action after proposal', function () {
			async function setupProposalFixture() {
				const ctx = await setupUnitrollerWIthBravoFixture();

				await ctx.priceOracle.setUnderlyingPrice(ctx.cErc20TokenA.address, 1n * DECIMAL);

				const COLLATERAL_FACTOR = new Bignumber(0.5).multipliedBy(DECIMAL.toString()).toString();

				const abi = new ethers.utils.AbiCoder();

				await ctx.governorBravoProxy.propose(
					[ctx.unitrollerProxy.address],
					[0],
					['_setCollateralFactor(address,uint256)'],
					[abi.encode(['address', 'uint256'], [ctx.cErc20TokenA.address, COLLATERAL_FACTOR])],
					'',
				);

				const proposalId = await ctx.governorBravoProxy.proposalCount();

				const proposeStartBlock = await time.latestBlock();

				// console.log('propose start block', proposeStartBlock);

				// wait MIN_VOTING_DELAY delay block
				await mineUpTo(proposeStartBlock + 2);

				return { ...ctx, proposalId, proposeStartBlock, COLLATERAL_FACTOR };
			}

			it('Should vote for proposal', async function () {
				const { owner, proposalId, governorBravoProxy } = await loadFixture(setupProposalFixture);

				await governorBravoProxy.castVote(proposalId, 1);

				const receipt = await governorBravoProxy.getReceipt(proposalId, owner.address);

				expect(receipt.hasVoted).to.equal(true);
				expect(receipt.support).to.equal(1);
				expect(receipt.votes).to.equal(9998999n * DECIMAL);
			});

			it('Should excute for proposal after vote Succeeded', async function () {
				const {
					timelock,
					proposalId,
					proposeStartBlock,
					governorBravoProxy,
					unitrollerProxy,
					cErc20TokenA,
					COLLATERAL_FACTOR,
				} = await loadFixture(setupProposalFixture);

				await governorBravoProxy.castVote(proposalId, 1);

				const votingPeriod = await governorBravoProxy.votingPeriod();

				await mineUpTo(proposeStartBlock + votingPeriod.toNumber() + 1);

				// const state = await governorBravoProxy.state(proposalId);

				// console.log(state);

				// Queue Proposal
				await governorBravoProxy.queue(proposalId);

				// Calculate Timelock delay
				const blockTimestamps = await time.latest();
				const delay = await timelock.delay();
				const eta = blockTimestamps + delay.toNumber() + 1;

				// Wait for timelock
				await time.increaseTo(eta);

				// Execute proposal
				await governorBravoProxy.execute(proposalId);

				const market = await unitrollerProxy.markets(cErc20TokenA.address);

				expect(market.collateralFactorMantissa).to.equal(COLLATERAL_FACTOR);
			});
		});
	});
});
