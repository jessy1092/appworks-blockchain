import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('Basic', function () {
	// We define a fixture to reuse the same setup in every test.
	// We use loadFixture to run this setup once, snapshot that state,
	// and reset Hardhat Network to that snapshot in every test.
	async function deployOneYearLockFixture() {
		// Contracts are deployed using the first signer/account by default
		const [owner, otherAccount] = await ethers.getSigners();

		const Basic = await ethers.getContractFactory('Basic');
		const basic = await Basic.deploy();

		return { basic, owner, otherAccount };
	}

	describe('Deployment', function () {
		it('Should set the right owner', async function () {
			const { basic, owner } = await loadFixture(deployOneYearLockFixture);

			expect(await basic.owner()).to.equal(owner.address);
		});

		it('Should receive and store the funds to lock', async function () {
			const { basic } = await loadFixture(deployOneYearLockFixture);

			expect(await ethers.provider.getBalance(basic.address)).to.equal(0);
		});
	});
});
