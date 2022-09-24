import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('MultiSigWallet', function () {
	// We define a fixture to reuse the same setup in every test.
	// We use loadFixture to run this setup once, snapshot that state,
	// and reset Hardhat Network to that snapshot in every test.
	async function deployOneYearLockFixture() {
		const DefalutValue = 1_000_000_000;

		// Contracts are deployed using the first signer/account by default
		const [owner, ...otherAccount] = await ethers.getSigners();

		const Basic = await ethers.getContractFactory('MultiSigWallet');
		const basic = await Basic.deploy(
			[owner.address, otherAccount[0].address, otherAccount[1].address],
			2,
			{ value: DefalutValue },
		);

		return { basic, owner, otherAccount, DefalutValue };
	}

	describe('Deployment', function () {
		it('Should set the right owners and required', async function () {
			const { basic, owner, otherAccount } = await loadFixture(deployOneYearLockFixture);

			const owner1 = await basic.owners(0);
			const owner2 = await basic.owners(1);
			const owner3 = await basic.owners(2);
			const required = await basic.required();

			expect(owner1).to.equal(owner.address);
			expect(owner2).to.equal(otherAccount[0].address);
			expect(owner3).to.equal(otherAccount[1].address);
			expect(required).to.equal(2);
		});

		it('Should receive and store the funds to lock', async function () {
			const { basic, DefalutValue } = await loadFixture(deployOneYearLockFixture);

			expect(await ethers.provider.getBalance(basic.address)).to.equal(DefalutValue);
		});
	});

	describe('Approve', function () {
		it('Should approve with owner', async function () {
			const { basic, owner, otherAccount } = await loadFixture(deployOneYearLockFixture);

			await basic.submit(otherAccount[3].address, 1, '0x00', false);
			await basic.approve(0);

			const approve = await basic.approved(0, owner.address);

			expect(approve).to.equal(true);
		});

		it('Should approved by other owner', async function () {
			const { basic, otherAccount } = await loadFixture(deployOneYearLockFixture);

			await basic.submit(otherAccount[3].address, 1, '0x00', false);

			await basic.connect(otherAccount[0]).approve(0);

			const approve = await basic.approved(0, otherAccount[0].address);

			expect(approve).to.equal(true);
		});
	});

	describe('Execute', function () {
		it('Should approve with owner', async function () {
			const { basic, owner, otherAccount } = await loadFixture(deployOneYearLockFixture);

			await basic.submit(otherAccount[3].address, 1, '0x00', true);
			await basic.approve(0);
			await basic.connect(otherAccount[0]).approve(0);

			await basic.execute(0);

			const tx = await basic.transactions(0);

			expect(tx.executed).to.equal(true);
		});
	});
});
