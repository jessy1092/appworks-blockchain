import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('SimpleStorage', function () {
	// We define a fixture to reuse the same setup in every test.
	// We use loadFixture to run this setup once, snapshot that state,
	// and reset Hardhat Network to that snapshot in every test.
	async function deployOneYearLockFixture() {
		// Contracts are deployed using the first signer/account by default
		const [owner, otherAccount] = await ethers.getSigners();

		const SimpleStorage = await ethers.getContractFactory('SimpleStorage');
		const simpleStorage = await SimpleStorage.deploy();

		return { simpleStorage, owner, otherAccount };
	}

	describe('Deployment', function () {
		it('Should set the right owner', async function () {
			const { simpleStorage, owner } = await loadFixture(deployOneYearLockFixture);

			expect(await simpleStorage.owner()).to.equal(owner.address);
		});

		it('Should receive and store the funds to lock', async function () {
			const { simpleStorage } = await loadFixture(deployOneYearLockFixture);

			expect(await ethers.provider.getBalance(simpleStorage.address)).to.equal(0);
		});
	});

	describe('SetWithMemory', function () {
		it('Should change the storage', async function () {
			const { simpleStorage } = await loadFixture(deployOneYearLockFixture);

			await simpleStorage.setWithMemory('123');

			expect(await simpleStorage.text()).to.equal('123');
		});
	});

	describe('SetWithCalldata', function () {
		it('Should change the storage', async function () {
			const { simpleStorage } = await loadFixture(deployOneYearLockFixture);

			await simpleStorage.setWithCalldata('321');

			expect(await simpleStorage.text()).to.equal('321');
		});
	});
});
