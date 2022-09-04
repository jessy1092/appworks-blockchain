import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('AdvanceArray', function () {
	// We define a fixture to reuse the same setup in every test.
	// We use loadFixture to run this setup once, snapshot that state,
	// and reset Hardhat Network to that snapshot in every test.
	async function deployOneYearLockFixture() {
		// Contracts are deployed using the first signer/account by default
		const [owner, ...otherAccounts] = await ethers.getSigners();

		const AdvanceArray = await ethers.getContractFactory('AdvanceArray');
		const advanceArray = await AdvanceArray.deploy();

		return { advanceArray, owner, otherAccounts };
	}

	describe('Deployment', function () {
		it('Should set the right owner', async function () {
			const { advanceArray, owner } = await loadFixture(deployOneYearLockFixture);

			expect(await advanceArray.owner()).to.equal(owner.address);
		});

		it('Should receive and store the funds to lock', async function () {
			const { advanceArray } = await loadFixture(deployOneYearLockFixture);

			expect(await ethers.provider.getBalance(advanceArray.address)).to.equal(0);
		});
	});

	describe('removeWithShift', function () {
		it('Should correct order', async function () {
			const { advanceArray, otherAccounts } = await loadFixture(deployOneYearLockFixture);

			await advanceArray.push(otherAccounts[0].address);
			await advanceArray.push(otherAccounts[1].address);
			await advanceArray.push(otherAccounts[2].address);
			await advanceArray.push(otherAccounts[3].address);

			await advanceArray.removeWithShift(1);

			const [addr0, addr1, addr2] = await Promise.all([
				advanceArray.tokens(0),
				advanceArray.tokens(1),
				advanceArray.tokens(2),
			]);

			expect(addr0).to.equal(otherAccounts[0].address);
			expect(addr1).to.equal(otherAccounts[2].address);
			expect(addr2).to.equal(otherAccounts[3].address);
		});
	});

	describe('SetWithCalldata', function () {
		it('Should modify order', async function () {
			const { advanceArray, otherAccounts } = await loadFixture(deployOneYearLockFixture);

			await advanceArray.push(otherAccounts[0].address);
			await advanceArray.push(otherAccounts[1].address);
			await advanceArray.push(otherAccounts[2].address);
			await advanceArray.push(otherAccounts[3].address);

			await advanceArray.removeWithReplace(1);

			const [addr0, addr1, addr2] = await Promise.all([
				advanceArray.tokens(0),
				advanceArray.tokens(1),
				advanceArray.tokens(2),
			]);

			expect(addr0).to.equal(otherAccounts[0].address);
			expect(addr1).to.equal(otherAccounts[3].address);
			expect(addr2).to.equal(otherAccounts[2].address);
		});

		it('Should correct order if remove last one', async function () {
			const { advanceArray, otherAccounts } = await loadFixture(deployOneYearLockFixture);

			await advanceArray.push(otherAccounts[0].address);
			await advanceArray.push(otherAccounts[1].address);
			await advanceArray.push(otherAccounts[2].address);
			await advanceArray.push(otherAccounts[3].address);

			await advanceArray.removeWithReplace(3);

			const [addr0, addr1, addr2] = await Promise.all([
				advanceArray.tokens(0),
				advanceArray.tokens(1),
				advanceArray.tokens(2),
			]);

			expect(addr0).to.equal(otherAccounts[0].address);
			expect(addr1).to.equal(otherAccounts[1].address);
			expect(addr2).to.equal(otherAccounts[2].address);
		});
	});
});
