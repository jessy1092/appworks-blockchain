import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import Bignumber from 'bignumber.js';

import { DECIMAL, deployCErc20, deployCompound, deployERC20 } from './setup';
import { Comp } from '../../test-types/compound-protocol/contracts/Governance/Comp';
import { GovernorAlpha } from '../../test-types/compound-protocol/contracts/Governance/GovernorAlpha.sol/GovernorAlpha';
import { GovernorBravoDelegator } from '../../test-types/compound-protocol/contracts/Governance/GovernorBravoDelegator';
import { GovernorBravoDelegate } from '../../test-types/compound-protocol/contracts/Governance/GovernorBravoDelegate';
import { Timelock } from '../../test-types/compound-protocol/contracts/Timelock';

import GovernorAlphaData from '../../artifacts/compound-protocol/contracts/Governance/GovernorAlpha.sol/GovernorAlpha.json';

const SEC = 1;
const MIN = 60 * SEC;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe('Bravo', function () {
	// We define a fixture to reuse the same setup in every test.
	// We use loadFixture to run this setup once, snapshot that state,
	// and reset Hardhat Network to that snapshot in every test.
	async function deployCompTokenFixture() {
		const [owner, ...otherAccount] = await ethers.getSigners();

		const Comp = await ethers.getContractFactory('Comp');
		const comp = (await Comp.deploy(owner.address)) as Comp;

		return { owner, otherAccount, comp };
	}

	async function deployCompoundFixture() {
		// Contracts are deployed using the first signer/account by default
		const [owner, ...otherAccount] = await ethers.getSigners();

		const compound = await deployCompound(owner);

		return {
			owner,
			otherAccount,
			...compound,
		};
	}

	async function deployBravoFixture() {
		// Contracts are deployed using the first signer/account by default
		const [owner, ...otherAccount] = await ethers.getSigners();

		const TimelockContract = await ethers.getContractFactory('Timelock');
		const timelock = (await TimelockContract.deploy(owner.address, 2 * DAY)) as Timelock;

		const Comp = await ethers.getContractFactory('Comp');
		const comp = (await Comp.deploy(owner.address)) as Comp;

		const GovernorAlphaContract = await ethers.getContractFactory(
			GovernorAlphaData.abi,
			GovernorAlphaData.bytecode,
		);
		const governorAlpha = (await GovernorAlphaContract.deploy(
			'0x0000000000000000000000000000000000000000',
			comp.address,
			'0x0000000000000000000000000000000000000000',
		)) as GovernorAlpha;

		const GovernorBravoDelegateContract = await ethers.getContractFactory('GovernorBravoDelegate');
		const governorBravoDelegate =
			(await GovernorBravoDelegateContract.deploy()) as GovernorBravoDelegate;

		// address timelock_,
		// address comp_,
		// address admin_,
		// address implementation_,
		// uint votingPeriod_,
		// uint votingDelay_,
		// uint proposalThreshold_
		const GovernorBravoDelegatorContract = await ethers.getContractFactory(
			'GovernorBravoDelegator',
		);
		const governorBravoDelegator = (await GovernorBravoDelegatorContract.deploy(
			timelock.address,
			comp.address,
			owner.address,
			governorBravoDelegate.address,
			5760, // block with 24hour
			1,
			1000n * DECIMAL,
		)) as GovernorBravoDelegator;

		// Setup Bravo Proxy let hardhat counld work
		const governorBravoProxy = (await governorBravoDelegate.attach(
			governorBravoDelegator.address,
		)) as GovernorBravoDelegate;

		const blockTimestamps = await time.latest();

		const abi = new ethers.utils.AbiCoder();

		// Setup timelock admin can be called by bravo
		await timelock.queueTransaction(
			timelock.address,
			0,
			'setPendingAdmin(address)',
			abi.encode(['address'], [governorBravoDelegator.address]),
			blockTimestamps + 2 * DAY + 1,
		);

		await time.increaseTo(blockTimestamps + 2 * DAY + 1);

		await timelock.executeTransaction(
			timelock.address,
			0,
			'setPendingAdmin(address)',
			abi.encode(['address'], [governorBravoDelegator.address]),
			blockTimestamps + 2 * DAY + 1,
		);

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
});
