import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import { CErc20Delegate } from '../test-types/compound-protocol/contracts/CErc20Delegate';
import { CErc20Delegator } from '../test-types/compound-protocol/contracts/CErc20Delegator';
import { Comptroller } from '../test-types/compound-protocol/contracts/Comptroller';
import { Unitroller } from '../test-types/compound-protocol/contracts/Unitroller';
import { SimplePriceOracle } from '../test-types/compound-protocol/contracts/SimplePriceOracle';
import { ZeroInterestRateModel } from '../test-types/contracts/Compound.sol/ZeroInterestRateModel';
import { TestToken } from '../test-types/contracts/Compound.sol/TestToken';

const DECIMAL = 10n ** 18n;

describe('Compound', function () {
	// We define a fixture to reuse the same setup in every test.
	// We use loadFixture to run this setup once, snapshot that state,
	// and reset Hardhat Network to that snapshot in every test.
	async function deployERC20Fixture() {
		const [owner, ...otherAccount] = await ethers.getSigners();

		const TestToken = await ethers.getContractFactory('TestToken');
		const testToken = (await TestToken.deploy()) as TestToken;

		return { owner, otherAccount, testToken };
	}

	async function deployControllerFixture() {
		// Setup Comptroller
		const ComptrollerContract = await ethers.getContractFactory('Comptroller');
		const comptrollerContract = (await ComptrollerContract.deploy()) as Comptroller;

		const UnitrollerContract = await ethers.getContractFactory('Unitroller');
		const unitrollerContract = (await UnitrollerContract.deploy()) as Unitroller;

		// Unitroller Setup implementation
		await unitrollerContract._setPendingImplementation(comptrollerContract.address);
		await comptrollerContract._become(unitrollerContract.address);

		// Setup Unitroller Proxy let hardhat counld work
		const unitrollerProxy = (await comptrollerContract.attach(
			unitrollerContract.address,
		)) as Comptroller;

		return { unitrollerProxy };
	}

	async function deployCompoundFixture() {
		// Contracts are deployed using the first signer/account by default
		const { owner, otherAccount, testToken } = await deployERC20Fixture();

		// Setup Controller
		const { unitrollerProxy } = await deployControllerFixture();

		// Setup InterestRateModel
		const ZeroInterestRateModelContract = await ethers.getContractFactory('ZeroInterestRateModel');
		const zeroInterestRateModelContract =
			(await ZeroInterestRateModelContract.deploy()) as ZeroInterestRateModel;

		// Setup Oracle
		const SimplePriceOracleContract = await ethers.getContractFactory('SimplePriceOracle');
		const simplePriceOracleContract =
			(await SimplePriceOracleContract.deploy()) as SimplePriceOracle;

		// Setup CErc20Delegate
		const CErc20TokenDelegate = await ethers.getContractFactory('CErc20Delegate');
		const cErc20TokenDelegate = (await CErc20TokenDelegate.deploy()) as CErc20Delegate;

		// address underlying_,
		// ComptrollerInterface comptroller_,
		// InterestRateModel interestRateModel_,
		// uint initialExchangeRateMantissa_,
		// string memory name_,
		// string memory symbol_,
		// uint8 decimals_,
		// address payable admin_,
		// address implementation_,
		// bytes memory becomeImplementationData
		const CErc20TokenDelegator = await ethers.getContractFactory('CErc20Delegator');
		const cErc20TokenDelegator = (await CErc20TokenDelegator.deploy(
			testToken.address,
			unitrollerProxy.address,
			zeroInterestRateModelContract.address,
			1n * DECIMAL,
			'cTestToken',
			'cTT',
			18,
			owner.address,
			cErc20TokenDelegate.address,
			'0x00',
		)) as CErc20Delegator;

		await unitrollerProxy._setPriceOracle(simplePriceOracleContract.address);

		await unitrollerProxy._supportMarket(cErc20TokenDelegator.address);

		return { owner, otherAccount, testToken, unitrollerProxy, cErc20TokenDelegator };
	}

	describe('Deployment', function () {
		it('Should set the right admin', async function () {
			const { owner, unitrollerProxy } = await loadFixture(deployCompoundFixture);
			expect(await unitrollerProxy.admin()).to.equal(owner.address);
		});

		it('Should have TestToken', async function () {
			const { owner, testToken } = await loadFixture(deployERC20Fixture);
			const balance = await testToken.balanceOf(owner.address);
			expect(balance).to.equal(100000000n * DECIMAL);
		});
	});

	describe('mint/redeem', function () {
		it('Should mint CErc20 Token by TestToken', async function () {
			const { owner, testToken, cErc20TokenDelegator } = await loadFixture(deployCompoundFixture);

			const MINT_AMOUNT = 100n * DECIMAL;

			await testToken.approve(cErc20TokenDelegator.address, MINT_AMOUNT);

			await cErc20TokenDelegator.mint(MINT_AMOUNT);

			const contractBalance = await testToken.balanceOf(cErc20TokenDelegator.address);

			// owner's cErc20 token balance === MINT_AMOUNT
			const balance = await cErc20TokenDelegator.balanceOf(owner.address);

			expect(contractBalance).to.equal(MINT_AMOUNT);
			expect(balance).to.equal(MINT_AMOUNT);
		});

		it('Should redeem CErc20 Token and get TestToken', async function () {
			const { owner, testToken, cErc20TokenDelegator } = await loadFixture(deployCompoundFixture);

			const MINT_AMOUNT = 100n * DECIMAL;

			await testToken.approve(cErc20TokenDelegator.address, MINT_AMOUNT);

			await cErc20TokenDelegator.mint(MINT_AMOUNT);

			await cErc20TokenDelegator.approve(owner.address, MINT_AMOUNT);

			// owner's testToken increase, cErc20TokenDelegator's testToken decrease
			await expect(cErc20TokenDelegator.redeem(MINT_AMOUNT)).to.changeTokenBalances(
				testToken,
				[owner, cErc20TokenDelegator],
				[MINT_AMOUNT, -MINT_AMOUNT],
			);

			// owner's cErc20 token should be 0
			const balance = await cErc20TokenDelegator.balanceOf(owner.address);

			expect(balance).to.equal(0);
		});
	});
});
