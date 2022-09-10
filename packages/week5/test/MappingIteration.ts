import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('MappingIteraction', function () {
	// We define a fixture to reuse the same setup in every test.
	// We use loadFixture to run this setup once, snapshot that state,
	// and reset Hardhat Network to that snapshot in every test.
	async function deployOneYearLockFixture() {
		// Contracts are deployed using the first signer/account by default
		const [owner, ...otherAccounts] = await ethers.getSigners();

		const MappingIteraction = await ethers.getContractFactory('MappingIteraction');
		const mapIter = await MappingIteraction.deploy();

		return { mapIter, owner, otherAccounts };
	}

	describe('Deployment', function () {
		it('Should set the right owner', async function () {
			const { mapIter, owner } = await loadFixture(deployOneYearLockFixture);

			expect(await mapIter.owner()).to.equal(owner.address);
		});

		it('Should receive and store the funds to lock', async function () {
			const { mapIter } = await loadFixture(deployOneYearLockFixture);

			expect(await ethers.provider.getBalance(mapIter.address)).to.equal(0);
		});
	});

	describe('Set', function () {
		it('Should add the last', async function () {
			const { mapIter, owner, otherAccounts } = await loadFixture(deployOneYearLockFixture);

			await mapIter.set(owner.address, 100n);
			await mapIter.set(otherAccounts[0].address, 200n);

			const balance = await mapIter.last();
			const size = await mapIter.getSize();

			expect(balance).to.equal(200n);
			expect(size).to.equal(2);
		});

		it('Should get by index', async function () {
			const { mapIter, owner, otherAccounts } = await loadFixture(deployOneYearLockFixture);

			await mapIter.set(owner.address, 100n);
			await mapIter.set(otherAccounts[0].address, 200n);
			await mapIter.set(otherAccounts[1].address, 300n);

			const balance = await mapIter.get(1);

			expect(balance).to.equal(200n);
		});

		it('Should record index by address', async function () {
			const { mapIter, owner, otherAccounts } = await loadFixture(deployOneYearLockFixture);

			await mapIter.set(owner.address, 100n);
			await mapIter.set(otherAccounts[0].address, 200n);
			await mapIter.set(otherAccounts[1].address, 300n);

			const index = await mapIter.insertedIndex(otherAccounts[0].address);

			expect(index).to.equal(2); // index + 1
		});
	});

	describe('Del', function () {
		it('Should remove by address ', async function () {
			const { mapIter, owner, otherAccounts } = await loadFixture(deployOneYearLockFixture);

			await mapIter.set(owner.address, 100n);
			await mapIter.set(otherAccounts[0].address, 200n);
			await mapIter.set(otherAccounts[1].address, 300n);
			await mapIter.set(otherAccounts[2].address, 400n);

			const DeleteAddress = otherAccounts[0].address;

			await mapIter.del(DeleteAddress);

			const index = await mapIter.insertedIndex(DeleteAddress);
			const balance = await mapIter.balances(DeleteAddress);
			const size = await mapIter.getSize();

			const replaceBalance = await mapIter.get(1);
			const replaceAddress = await mapIter.getKey(1);

			expect(index).to.equal(0);
			expect(balance).to.equal(0);
			expect(size).to.equal(3);

			expect(replaceBalance).to.equal(400n);
			expect(replaceAddress).to.equal(otherAccounts[2].address);
		});
	});

	describe('Add', function () {
		it('Should add by index ', async function () {
			const { mapIter, owner, otherAccounts } = await loadFixture(deployOneYearLockFixture);

			await mapIter.set(owner.address, 100n);
			await mapIter.set(otherAccounts[0].address, 200n);
			await mapIter.set(otherAccounts[1].address, 300n);

			const insertAddress = otherAccounts[2].address;

			await mapIter.add(otherAccounts[2].address, 400n, 1);

			const index = await mapIter.insertedIndex(insertAddress);
			const balance = await mapIter.balances(insertAddress);
			const resultAddress = await mapIter.keys(index.sub(1));

			const lastBalance = await mapIter.last();
			const lastAddress = await mapIter.getKey(3);

			expect(index).to.equal(2); // 實際上是用 index + 1 來紀錄
			expect(balance).to.equal(400n);
			expect(resultAddress).to.equal(insertAddress);

			expect(lastBalance).to.equal(200n);
			expect(lastAddress).to.equal(otherAccounts[0].address);
		});
	});
});
