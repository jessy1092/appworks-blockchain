import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers, network } from 'hardhat';
// import BigNumber from 'bignumber.js';
import { ForkToken } from '../test-types/contracts/ForkToken';

const BinanceWallet = '0xF977814e90dA44bFA03b6295A0616a897441aceC';
const USDCAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

describe('Fork network', function () {
	// We define a fixture to reuse the sayme setup in every test.
	// We use loadFixture to run this setup once, snapshot that state,
	// and reset Hardhat Network to that snapshot in every test.
	async function deployOneYearLockFixture() {
		// Contracts are deployed using the first signer/account by default

		await network.provider.request({
			method: 'hardhat_impersonateAccount',
			params: [BinanceWallet],
		});
		const wallet = await ethers.getSigner(BinanceWallet);

		const usdc = (await ethers.getContractAt('ForkToken', USDCAddress)) as ForkToken;

		const [owner] = await ethers.getSigners();

		// const Basic = await ethers.getContractFactory('King');
		// const basic = await Basic.deploy(otherAccount.address);

		return { wallet, usdc, owner };
	}

	describe('Deployment', function () {
		it('Should set the right owner', async function () {
			const { wallet, usdc } = await loadFixture(deployOneYearLockFixture);

			let balance = await usdc.balanceOf(BinanceWallet);

			expect(balance).to.gt(0);
		});

		it('Should receive and store the funds to lock', async function () {
			let transferAmount = 100000;
			const { wallet, usdc, owner } = await loadFixture(deployOneYearLockFixture);

			await usdc.connect(wallet).transfer(owner.address, transferAmount);

			const balance = await usdc.balanceOf(owner.address);

			expect(balance).to.equal(transferAmount);
		});
	});
});
