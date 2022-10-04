import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers, upgrades } from 'hardhat';
import BigNumber from 'bignumber.js';

import { AppWorks } from '../test-types/contracts/AppWorks';

describe('AppWorks', function () {
	// We define a fixture to reuse the same setup in every test.
	// We use loadFixture to run this setup once, snapshot that state,
	// and reset Hardhat Network to that snapshot in every test.
	async function deployOneYearLockFixture() {
		const DEFAULT_MINT_PRICE = ethers.utils.parseEther('0.01');
		// Contracts are deployed using the first signer/account by default
		const [owner, ...otherAccount] = await ethers.getSigners();

		const Basic = await ethers.getContractFactory('AppWorks');
		const basic = (await upgrades.deployProxy(Basic, {
			initializer: 'initialize',
			kind: 'uups',
		})) as AppWorks;

		return { DEFAULT_MINT_PRICE, basic, owner, otherAccount };
	}

	describe('Deployment', function () {
		it('Should set the right name and symbol ', async function () {
			const { basic } = await loadFixture(deployOneYearLockFixture);

			expect(await basic.name()).to.equal('AppWorks');
			expect(await basic.symbol()).to.equal('AW');
		});

		it('Should balance zero', async function () {
			const { basic } = await loadFixture(deployOneYearLockFixture);

			expect(await ethers.provider.getBalance(basic.address)).to.equal(0);
		});
	});

	describe('Mint', function () {
		it('Should revert with mintActive = false', async function () {
			const { basic, DEFAULT_MINT_PRICE } = await loadFixture(deployOneYearLockFixture);

			await expect(basic.mint(1, { value: DEFAULT_MINT_PRICE })).to.be.revertedWith(
				'Inactive Mint',
			);
		});

		it('Should revert with excess maximun number of mint', async function () {
			const { basic, DEFAULT_MINT_PRICE } = await loadFixture(deployOneYearLockFixture);

			await basic.toggleMint();

			await expect(basic.mint(21, { value: DEFAULT_MINT_PRICE.mul(21) })).to.be.revertedWith(
				'Excess maximun number of mint',
			);
		});

		it('Should be 10 of the maximun number of mint by user', async function () {
			const { basic, otherAccount, DEFAULT_MINT_PRICE } = await loadFixture(
				deployOneYearLockFixture,
			);

			await basic.toggleMint();

			await expect(
				basic.connect(otherAccount[0]).mint(11, { value: DEFAULT_MINT_PRICE.mul(11) }),
			).to.be.revertedWith('Excess maximun number of mint');
		});

		it('Should match addressMintedBalance after mint', async function () {
			const { basic, owner, DEFAULT_MINT_PRICE } = await loadFixture(deployOneYearLockFixture);

			await basic.toggleMint();

			await basic.mint(2, { value: DEFAULT_MINT_PRICE.mul(2) });

			expect(await basic.addressMintedBalance(owner.address)).to.equal('2');
		});

		it('Should mint many time if not excess maximun number of mint', async function () {
			const { basic, owner, DEFAULT_MINT_PRICE } = await loadFixture(deployOneYearLockFixture);

			await basic.toggleMint();

			await basic.mint(1, { value: DEFAULT_MINT_PRICE });
			await basic.mint(2, { value: DEFAULT_MINT_PRICE.mul(2) });

			expect(await basic.addressMintedBalance(owner.address)).to.equal('3');
		});

		it('Should revert with excess maximun supply', async function () {
			const { basic, otherAccount, DEFAULT_MINT_PRICE } = await loadFixture(
				deployOneYearLockFixture,
			);

			await basic.toggleMint();

			await basic.mint(20, { value: DEFAULT_MINT_PRICE.mul(20) });
			await basic.connect(otherAccount[0]).mint(10, { value: DEFAULT_MINT_PRICE.mul(10) });
			await basic.connect(otherAccount[1]).mint(10, { value: DEFAULT_MINT_PRICE.mul(10) });
			await basic.connect(otherAccount[2]).mint(10, { value: DEFAULT_MINT_PRICE.mul(10) });
			await basic.connect(otherAccount[3]).mint(10, { value: DEFAULT_MINT_PRICE.mul(10) });
			await basic.connect(otherAccount[4]).mint(10, { value: DEFAULT_MINT_PRICE.mul(10) });
			await basic.connect(otherAccount[5]).mint(10, { value: DEFAULT_MINT_PRICE.mul(10) });
			await basic.connect(otherAccount[6]).mint(10, { value: DEFAULT_MINT_PRICE.mul(10) });
			await basic.connect(otherAccount[7]).mint(10, { value: DEFAULT_MINT_PRICE.mul(10) });

			await expect(
				basic.connect(otherAccount[10]).mint(1, { value: DEFAULT_MINT_PRICE }),
			).to.be.revertedWith('Excess maximun supply');
		});

		it('Should revert with zero mint', async function () {
			const { basic } = await loadFixture(deployOneYearLockFixture);

			await basic.toggleMint();

			await expect(basic.mint(0)).to.be.revertedWith('Zero mint');
		});

		it('Should revert with price not match', async function () {
			const { basic, DEFAULT_MINT_PRICE } = await loadFixture(deployOneYearLockFixture);

			await basic.toggleMint();

			await expect(basic.mint(2, { value: DEFAULT_MINT_PRICE })).to.be.revertedWith(
				'Not match ETH with price',
			);
		});

		it('Should match totalSupply and value after mint', async function () {
			const { basic, DEFAULT_MINT_PRICE } = await loadFixture(deployOneYearLockFixture);

			await basic.toggleMint();

			await basic.mint(2, { value: DEFAULT_MINT_PRICE.mul(2) });

			expect(await basic.totalSupply()).to.equal('2');
			expect(await ethers.provider.getBalance(basic.address)).to.equal(DEFAULT_MINT_PRICE.mul(2));
		});
	});

	describe('setPrice', function () {
		it('Should change mint price', async function () {
			const { basic, DEFAULT_MINT_PRICE } = await loadFixture(deployOneYearLockFixture);

			await basic.toggleMint();

			await basic.mint(2, { value: DEFAULT_MINT_PRICE.mul(2) });

			const NEW_MINT_PRICE = DEFAULT_MINT_PRICE.mul(2);

			await basic.setPrice(NEW_MINT_PRICE);

			await basic.mint(2, { value: NEW_MINT_PRICE.mul(2) });

			expect(await basic.price()).to.equal(NEW_MINT_PRICE);
		});
	});

	describe('withdrawBalance', function () {
		it('Should withdraw balance', async function () {
			const { basic, DEFAULT_MINT_PRICE } = await loadFixture(deployOneYearLockFixture);

			await basic.toggleMint();

			await basic.mint(2, { value: DEFAULT_MINT_PRICE.mul(2) });

			expect(await ethers.provider.getBalance(basic.address)).to.equal(DEFAULT_MINT_PRICE.mul(2));

			await basic.withdrawBalance();

			expect(await ethers.provider.getBalance(basic.address)).to.equal(0);
		});
	});
});
