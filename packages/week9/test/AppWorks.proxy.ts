import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers, upgrades } from 'hardhat';
import keccak256 from 'keccak256';
import BigNumber from 'bignumber.js';

import { createMerkleTree } from '../utils';
import { AppWorks, AppWorksV2, AppWorksV3 } from '../test-types';

describe('AppWorks', function () {
	// We define a fixture to reuse the same setup in every test.
	// We use loadFixture to run this setup once, snapshot that state,
	// and reset Hardhat Network to that snapshot in every test.
	async function deployAppWorksFixture() {
		const DEFAULT_MINT_PRICE = ethers.utils.parseEther('0.01');
		// Contracts are deployed using the first signer/account by default
		const allAccounts = await ethers.getSigners();

		const [owner, ...otherAccount] = allAccounts;

		const AppWorks = await ethers.getContractFactory('AppWorks');
		const AppWorksV2 = await ethers.getContractFactory('AppWorksV2');
		const AppWorksV3 = await ethers.getContractFactory('AppWorksV3');

		const appWorks = (await upgrades.deployProxy(AppWorks, {
			initializer: 'initialize',
			kind: 'uups',
		})) as AppWorks;

		const appWorksV2 = (await upgrades.upgradeProxy(appWorks.address, AppWorksV2)) as AppWorksV2;
		const basic = (await upgrades.upgradeProxy(appWorks.address, AppWorksV3)) as AppWorksV3;

		return { DEFAULT_MINT_PRICE, basic, owner, otherAccount, allAccounts };
	}

	async function createWhitelistFixture() {
		const { allAccounts, ...other } = await deployAppWorksFixture();

		const addresses = allAccounts.slice(0, 19).map(account => account.address);

		const merkleTree = createMerkleTree(addresses);

		return {
			merkleTree,
			merkleRoot: `0x${merkleTree.getRoot().toString('hex')}`,
			notInWhitelistAccount: allAccounts[19],
			...other,
		};
	}

	describe('Deployment', function () {
		it('Should set the right name and symbol ', async function () {
			const { basic } = await loadFixture(deployAppWorksFixture);

			expect(await basic.name()).to.equal('AppWorks');
			expect(await basic.symbol()).to.equal('AW');
		});

		it('Should balance zero', async function () {
			const { basic } = await loadFixture(deployAppWorksFixture);

			expect(await ethers.provider.getBalance(basic.address)).to.equal(0);
		});
	});

	describe('Mint', function () {
		it('Should revert with mintActive = false', async function () {
			const { basic, DEFAULT_MINT_PRICE } = await loadFixture(deployAppWorksFixture);

			await expect(basic.mint(1, { value: DEFAULT_MINT_PRICE })).to.be.revertedWith(
				'Inactive Mint',
			);
		});

		it('Should revert with excess maximun number of mint', async function () {
			const { basic, DEFAULT_MINT_PRICE } = await loadFixture(deployAppWorksFixture);

			await basic.toggleMint();

			await expect(basic.mint(21, { value: DEFAULT_MINT_PRICE.mul(21) })).to.be.revertedWith(
				'Excess maximun number of mint',
			);
		});

		it('Should be 10 of the maximun number of mint by user', async function () {
			const { basic, otherAccount, DEFAULT_MINT_PRICE } = await loadFixture(deployAppWorksFixture);

			await basic.toggleMint();

			await expect(
				basic.connect(otherAccount[0]).mint(11, { value: DEFAULT_MINT_PRICE.mul(11) }),
			).to.be.revertedWith('Excess maximun number of mint');
		});

		it('Should match balanceOf after mint', async function () {
			const { basic, owner, DEFAULT_MINT_PRICE } = await loadFixture(deployAppWorksFixture);

			await basic.toggleMint();

			await basic.mint(2, { value: DEFAULT_MINT_PRICE.mul(2) });

			expect(await basic.balanceOf(owner.address)).to.equal('2');
		});

		it('Should mint many time if not excess maximun number of mint', async function () {
			const { basic, owner, DEFAULT_MINT_PRICE } = await loadFixture(deployAppWorksFixture);

			await basic.toggleMint();

			await basic.mint(1, { value: DEFAULT_MINT_PRICE });
			await basic.mint(2, { value: DEFAULT_MINT_PRICE.mul(2) });

			expect(await basic.balanceOf(owner.address)).to.equal('3');
		});

		it('Should revert with excess maximun supply', async function () {
			const { basic, otherAccount, DEFAULT_MINT_PRICE } = await loadFixture(deployAppWorksFixture);

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
			const { basic } = await loadFixture(deployAppWorksFixture);

			await basic.toggleMint();

			await expect(basic.mint(0)).to.be.revertedWith('Zero mint');
		});

		it('Should revert with price not match', async function () {
			const { basic, DEFAULT_MINT_PRICE } = await loadFixture(deployAppWorksFixture);

			await basic.toggleMint();

			await expect(basic.mint(2, { value: DEFAULT_MINT_PRICE })).to.be.revertedWith(
				'Not match ETH with price',
			);
		});

		it('Should match totalSupply and value after mint', async function () {
			const { basic, DEFAULT_MINT_PRICE } = await loadFixture(deployAppWorksFixture);

			await basic.toggleMint();

			await basic.mint(2, { value: DEFAULT_MINT_PRICE.mul(2) });

			expect(await basic.totalSupply()).to.equal('2');
			expect(await ethers.provider.getBalance(basic.address)).to.equal(DEFAULT_MINT_PRICE.mul(2));
		});
	});

	describe('setPrice', function () {
		it('Should change mint price', async function () {
			const { basic, DEFAULT_MINT_PRICE } = await loadFixture(deployAppWorksFixture);

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
			const { basic, DEFAULT_MINT_PRICE } = await loadFixture(deployAppWorksFixture);

			await basic.toggleMint();

			await basic.mint(2, { value: DEFAULT_MINT_PRICE.mul(2) });

			expect(await ethers.provider.getBalance(basic.address)).to.equal(DEFAULT_MINT_PRICE.mul(2));

			await basic.withdrawBalance();

			expect(await ethers.provider.getBalance(basic.address)).to.equal(0);
		});
	});

	describe('checkInWhitelist', function () {
		it('Should set merkleRoot with setMerkleRoot', async function () {
			const { basic, merkleRoot } = await loadFixture(createWhitelistFixture);

			await basic.setMerkleRoot(merkleRoot);

			expect(await basic.merkleRoot()).to.equal(merkleRoot);
		});

		it('Should return true when pass correct proof', async function () {
			const { basic, owner, merkleTree, merkleRoot } = await loadFixture(createWhitelistFixture);

			await basic.setMerkleRoot(merkleRoot);

			const proof = merkleTree.getHexProof(keccak256(owner.address));

			await basic.checkInWhitelist(proof);

			expect(await basic.checkInWhitelist(proof)).to.equal(true);
		});

		it('Should return false when not pass correct proof', async function () {
			const { basic, notInWhitelistAccount, merkleTree, merkleRoot } = await loadFixture(
				createWhitelistFixture,
			);

			await basic.setMerkleRoot(merkleRoot);

			const proof = merkleTree.getHexProof(keccak256(notInWhitelistAccount.address));

			await basic.connect(notInWhitelistAccount).checkInWhitelist(proof);

			expect(await basic.checkInWhitelist(proof)).to.equal(false);
		});
	});

	describe('earlyMint', function () {
		it('Should revert with mintActive = false', async function () {
			const { basic, owner, DEFAULT_MINT_PRICE, merkleTree, merkleRoot } = await loadFixture(
				createWhitelistFixture,
			);

			await basic.setMerkleRoot(merkleRoot);

			const proof = merkleTree.getHexProof(keccak256(owner.address));

			await expect(basic.earlyMint(proof, 1, { value: DEFAULT_MINT_PRICE })).to.be.revertedWith(
				'Inactive Early Mint',
			);
		});

		it('Should revert with excess maximun number of mint', async function () {
			const { basic, owner, DEFAULT_MINT_PRICE, merkleTree, merkleRoot } = await loadFixture(
				createWhitelistFixture,
			);

			await basic.setMerkleRoot(merkleRoot);

			const proof = merkleTree.getHexProof(keccak256(owner.address));

			await basic.toggleEarlyMint();

			await expect(
				basic.earlyMint(proof, 21, { value: DEFAULT_MINT_PRICE.mul(21) }),
			).to.be.revertedWith('Excess maximun number of mint');
		});

		it('Should revert with not in whitelist', async function () {
			const { basic, notInWhitelistAccount, DEFAULT_MINT_PRICE, merkleTree, merkleRoot } =
				await loadFixture(createWhitelistFixture);

			await basic.setMerkleRoot(merkleRoot);

			const proof = merkleTree.getHexProof(keccak256(notInWhitelistAccount.address));

			await basic.toggleEarlyMint();

			await expect(
				basic
					.connect(notInWhitelistAccount)
					.earlyMint(proof, 1, { value: DEFAULT_MINT_PRICE.mul(1) }),
			).to.be.revertedWith('Not in whitelist');
		});

		it('Should be 10 of the maximun number of mint by user', async function () {
			const { basic, otherAccount, DEFAULT_MINT_PRICE, merkleTree, merkleRoot } = await loadFixture(
				createWhitelistFixture,
			);
			await basic.setMerkleRoot(merkleRoot);

			const normalAccount = otherAccount[0];
			const proof = merkleTree.getHexProof(keccak256(normalAccount.address));

			await basic.toggleEarlyMint();

			await expect(
				basic.connect(normalAccount).earlyMint(proof, 11, { value: DEFAULT_MINT_PRICE.mul(11) }),
			).to.be.revertedWith('Excess maximun number of mint');
		});

		it('Should match balanceOf after mint', async function () {
			const { basic, owner, DEFAULT_MINT_PRICE, merkleTree, merkleRoot } = await loadFixture(
				createWhitelistFixture,
			);

			await basic.setMerkleRoot(merkleRoot);

			const proof = merkleTree.getHexProof(keccak256(owner.address));

			await basic.toggleEarlyMint();

			await basic.earlyMint(proof, 2, { value: DEFAULT_MINT_PRICE.mul(2) });

			expect(await basic.balanceOf(owner.address)).to.equal('2');
		});

		it('Should mint many time if not excess maximun number of mint', async function () {
			const { basic, owner, DEFAULT_MINT_PRICE, merkleTree, merkleRoot } = await loadFixture(
				createWhitelistFixture,
			);

			await basic.setMerkleRoot(merkleRoot);

			const proof = merkleTree.getHexProof(keccak256(owner.address));

			await basic.toggleEarlyMint();

			await basic.earlyMint(proof, 1, { value: DEFAULT_MINT_PRICE });
			await basic.earlyMint(proof, 2, { value: DEFAULT_MINT_PRICE.mul(2) });

			expect(await basic.balanceOf(owner.address)).to.equal('3');
		});

		it('Should revert with excess maximun supply', async function () {
			const { basic, owner, otherAccount, DEFAULT_MINT_PRICE, merkleTree, merkleRoot } =
				await loadFixture(createWhitelistFixture);

			await basic.setMerkleRoot(merkleRoot);

			const proof = merkleTree.getHexProof(keccak256(owner.address));

			await basic.toggleEarlyMint();

			await basic.earlyMint(proof, 20, { value: DEFAULT_MINT_PRICE.mul(20) });
			await basic
				.connect(otherAccount[0])
				.earlyMint(merkleTree.getHexProof(keccak256(otherAccount[0].address)), 10, {
					value: DEFAULT_MINT_PRICE.mul(10),
				});
			await basic
				.connect(otherAccount[1])
				.earlyMint(merkleTree.getHexProof(keccak256(otherAccount[1].address)), 10, {
					value: DEFAULT_MINT_PRICE.mul(10),
				});
			await basic
				.connect(otherAccount[2])
				.earlyMint(merkleTree.getHexProof(keccak256(otherAccount[2].address)), 10, {
					value: DEFAULT_MINT_PRICE.mul(10),
				});
			await basic
				.connect(otherAccount[3])
				.earlyMint(merkleTree.getHexProof(keccak256(otherAccount[3].address)), 10, {
					value: DEFAULT_MINT_PRICE.mul(10),
				});
			await basic
				.connect(otherAccount[4])
				.earlyMint(merkleTree.getHexProof(keccak256(otherAccount[4].address)), 10, {
					value: DEFAULT_MINT_PRICE.mul(10),
				});
			await basic
				.connect(otherAccount[5])
				.earlyMint(merkleTree.getHexProof(keccak256(otherAccount[5].address)), 10, {
					value: DEFAULT_MINT_PRICE.mul(10),
				});
			await basic
				.connect(otherAccount[6])
				.earlyMint(merkleTree.getHexProof(keccak256(otherAccount[6].address)), 10, {
					value: DEFAULT_MINT_PRICE.mul(10),
				});
			await basic
				.connect(otherAccount[7])
				.earlyMint(merkleTree.getHexProof(keccak256(otherAccount[7].address)), 10, {
					value: DEFAULT_MINT_PRICE.mul(10),
				});

			await expect(
				basic
					.connect(otherAccount[10])
					.earlyMint(merkleTree.getHexProof(keccak256(otherAccount[10].address)), 1, {
						value: DEFAULT_MINT_PRICE,
					}),
			).to.be.revertedWith('Excess maximun supply');
		});

		it('Should revert with zero mint', async function () {
			const { basic, owner, merkleTree, merkleRoot } = await loadFixture(createWhitelistFixture);

			await basic.setMerkleRoot(merkleRoot);

			const proof = merkleTree.getHexProof(keccak256(owner.address));

			await basic.toggleEarlyMint();

			await expect(basic.earlyMint(proof, 0)).to.be.revertedWith('Zero mint');
		});

		it('Should revert with price not match', async function () {
			const { basic, owner, DEFAULT_MINT_PRICE, merkleTree, merkleRoot } = await loadFixture(
				createWhitelistFixture,
			);

			await basic.setMerkleRoot(merkleRoot);

			const proof = merkleTree.getHexProof(keccak256(owner.address));

			await basic.toggleEarlyMint();

			await expect(basic.earlyMint(proof, 2, { value: DEFAULT_MINT_PRICE })).to.be.revertedWith(
				'Not match ETH with price',
			);
		});

		it('Should match totalSupply and value after mint', async function () {
			const { basic, owner, DEFAULT_MINT_PRICE, merkleTree, merkleRoot } = await loadFixture(
				createWhitelistFixture,
			);

			await basic.setMerkleRoot(merkleRoot);

			const proof = merkleTree.getHexProof(keccak256(owner.address));

			await basic.toggleEarlyMint();

			await basic.earlyMint(proof, 2, { value: DEFAULT_MINT_PRICE.mul(2) });

			expect(await basic.totalSupply()).to.equal('2');
			expect(await ethers.provider.getBalance(basic.address)).to.equal(DEFAULT_MINT_PRICE.mul(2));
		});
	});

	describe('tokenURI', function () {
		it('Should empty with not setBaseURI', async function () {
			const { basic, DEFAULT_MINT_PRICE } = await loadFixture(deployAppWorksFixture);

			await basic.toggleMint();

			await basic.mint(2, { value: DEFAULT_MINT_PRICE.mul(2) });

			expect(await basic.tokenURI(1)).to.equal('');
		});

		it('Should get blind url before reveal', async function () {
			const { basic, DEFAULT_MINT_PRICE } = await loadFixture(deployAppWorksFixture);

			await basic.toggleMint();

			await basic.mint(2, { value: DEFAULT_MINT_PRICE.mul(2) });

			await basic.setBaseURI('https://example.com/');

			expect(await basic.tokenURI(1)).to.equal('https://example.com/blind');
		});

		it('Should get token url after reveal', async function () {
			const { basic, DEFAULT_MINT_PRICE } = await loadFixture(deployAppWorksFixture);

			await basic.toggleMint();

			await basic.mint(2, { value: DEFAULT_MINT_PRICE.mul(2) });

			await basic.setBaseURI('https://example.com/');

			await basic.toggleReveal();

			expect(await basic.tokenURI(1)).to.equal('https://example.com/1');
		});
	});

	describe('addressMintedBalance', function () {
		it('Should setup token id after mint', async function () {
			const { basic, owner, DEFAULT_MINT_PRICE } = await loadFixture(deployAppWorksFixture);

			await basic.toggleMint();

			await basic.mint(5, { value: DEFAULT_MINT_PRICE.mul(5) });

			const addressMintedBalance = await basic.addressMintedBalance(owner.address);

			const resultTokenId = new BigNumber(addressMintedBalance.toString())
				.toString(2)
				.split('')
				.reduce((p: number[], c, i) => {
					if (c === '1') {
						p.push(i + 1);
					}
					return p;
				}, []);

			expect(resultTokenId).to.eql([1, 2, 3, 4, 5]);
		});

		it('Should clear token id after transfer', async function () {
			const { basic, owner, otherAccount, DEFAULT_MINT_PRICE } = await loadFixture(
				deployAppWorksFixture,
			);

			await basic.toggleMint();

			await basic.mint(5, { value: DEFAULT_MINT_PRICE.mul(5) });

			await basic.approve(otherAccount[0].address, 2);

			await basic.transferFrom(owner.address, otherAccount[0].address, 2);

			const fromAddressMintedBalance = await basic.addressMintedBalance(owner.address);
			const toAddressMintedBalance = await basic
				.connect(otherAccount[0])
				.addressMintedBalance(otherAccount[0].address);

			const fromTokenId = new BigNumber(fromAddressMintedBalance.toString())
				.toString(2)
				.split('')
				.reverse()
				.reduce((p: number[], c, i) => {
					if (c === '1') {
						p.push(i + 1);
					}
					return p;
				}, []);

			const toTokenId = new BigNumber(toAddressMintedBalance.toString())
				.toString(2)
				.split('')
				.reverse()
				.reduce((p: number[], c, i) => {
					if (c === '1') {
						p.push(i + 1);
					}
					return p;
				}, []);

			expect(fromTokenId).to.eql([1, 3, 4, 5]);
			expect(toTokenId).to.eql([2]);
		});
	});
});
