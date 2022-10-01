import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import BigNumber from 'bignumber.js';

describe('WETH', function () {
	// We define a fixture to reuse the same setup in every test.
	// We use loadFixture to run this setup once, snapshot that state,
	// and reset Hardhat Network to that snapshot in every test.
	async function deployOneYearLockFixture() {
		// Contracts are deployed using the first signer/account by default
		const [owner, otherAccount] = await ethers.getSigners();

		const Basic = await ethers.getContractFactory('WETH');
		const basic = await Basic.deploy();

		return { basic, owner, otherAccount };
	}

	describe('Deployment', function () {
		it('Should set the right name and symbol ', async function () {
			const { basic } = await loadFixture(deployOneYearLockFixture);

			expect(await basic.name()).to.equal('Wrapped Ether');
			expect(await basic.symbol()).to.equal('WETH');
		});

		it('Should balance zero', async function () {
			const { basic } = await loadFixture(deployOneYearLockFixture);

			expect(await ethers.provider.getBalance(basic.address)).to.equal(0);
		});
	});

	describe('Deposit', function () {
		it('Should get WETH when deposit ETH ', async function () {
			const { basic, owner } = await loadFixture(deployOneYearLockFixture);

			const DepositValue = 1_000_000_000;

			await basic.deposit({ value: DepositValue });

			const wethBalance = await basic.balanceOf(owner.address);

			expect(new BigNumber(wethBalance.toString()).toString()).to.equal(
				new BigNumber(DepositValue).toString(),
			);
		});
	});

	describe('Withdraw', function () {
		it('Should reduce balance of WETH after withdraw ETH ', async function () {
			const { basic, owner } = await loadFixture(deployOneYearLockFixture);

			const DepositValue = 1_000_000_000;

			await basic.deposit({ value: DepositValue });

			const WithdrawValue = 100_000_000;

			await basic.withdraw(WithdrawValue);

			const balanceAfterWithdraw = await basic.balanceOf(owner.address);

			expect(new BigNumber(balanceAfterWithdraw.toString()).toString()).to.equal(
				new BigNumber(DepositValue).minus(WithdrawValue).toString(),
			);
		});
	});
});
