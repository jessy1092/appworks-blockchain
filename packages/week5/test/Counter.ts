import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('Counter', function () {
	// We define a fixture to reuse the same setup in every test.
	// We use loadFixture to run this setup once, snapshot that state,
	// and reset Hardhat Network to that snapshot in every test.
	async function deployOneYearLockFixture() {
		// Contracts are deployed using the first signer/account by default
		const [owner, otherAccount] = await ethers.getSigners();

		const Counter = await ethers.getContractFactory('Counter');
		const counter = await Counter.deploy();

		return { counter, owner, otherAccount };
	}

	describe('Deployment', function () {
		it('Should set the right owner', async function () {
			const { counter, owner } = await loadFixture(deployOneYearLockFixture);

			expect(await counter.owner()).to.equal(owner.address);
		});

		it('Should receive and store the funds to lock', async function () {
			const { counter } = await loadFixture(deployOneYearLockFixture);

			expect(await ethers.provider.getBalance(counter.address)).to.equal(0);
		});
	});

	describe('Increase', function () {
		it('Should add 1', async function () {
			const { counter } = await loadFixture(deployOneYearLockFixture);

			const originCount = await counter.count();

			await counter.increase();

			expect(await counter.count()).to.equal(originCount.add(1));
		});
	});

	describe('Decrease', function () {
		it('Should sub 1', async function () {
			const { counter } = await loadFixture(deployOneYearLockFixture);

			await counter.increase();

			const originCount = await counter.count();

			await counter.decrease();

			expect(await counter.count()).to.equal(originCount.sub(1));
		});
	});
});
