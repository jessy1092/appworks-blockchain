import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('PiggyBank', function () {
	const DefaultValue = 1_000_000_000;
	// We define a fixture to reuse the same setup in every test.
	// We use loadFixture to run this setup once, snapshot that state,
	// and reset Hardhat Network to that snapshot in every test.
	async function deployOneYearLockFixture() {
		// Contracts are deployed using the first signer/account by default
		const [owner] = await ethers.getSigners();

		const Basic = await ethers.getContractFactory('PiggyBank');
		const basic = await Basic.deploy({ value: DefaultValue });

		return { basic, owner, DefaultValue };
	}

	describe('Deployment', function () {
		it('Should set the right owner', async function () {
			const { basic, owner } = await loadFixture(deployOneYearLockFixture);

			expect(await basic.owner()).to.equal(owner.address);
		});

		it('Should receive and store the funds to lock', async function () {
			const { basic, DefaultValue } = await loadFixture(deployOneYearLockFixture);

			expect(await ethers.provider.getBalance(basic.address)).to.equal(DefaultValue);
		});
	});

	describe('Deposit/Withdraw', function () {
		it('Could deposit ether', async function () {
			const DepositValue = 1_000_000_000;

			const { basic, DefaultValue } = await loadFixture(deployOneYearLockFixture);

			await basic.deposit({ value: DepositValue });

			expect(await ethers.provider.getBalance(basic.address)).to.equal(DepositValue + DefaultValue);
		});

		it('Could withdraw ether', async function () {
			const { basic } = await loadFixture(deployOneYearLockFixture);

			await basic.withdraw();

			expect(await ethers.provider.getBalance(basic.address)).to.equal(0);
		});
	});
});
