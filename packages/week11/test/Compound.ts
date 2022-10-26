import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
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
	async function deployERC20(name: string, symbol: string): Promise<TestToken> {
		const TestToken = await ethers.getContractFactory('TestToken');
		const testToken = (await TestToken.deploy(name, symbol)) as TestToken;

		return testToken;
	}

	// We define a fixture to reuse the same setup in every test.
	// We use loadFixture to run this setup once, snapshot that state,
	// and reset Hardhat Network to that snapshot in every test.
	async function deployERC20Fixture() {
		const [owner, ...otherAccount] = await ethers.getSigners();

		const testToken = await deployERC20('TestToken', 'TT');

		return { owner, otherAccount, testToken };
	}

	async function deployCErc20(
		name: string,
		symbol: string,
		comptroller: Comptroller,
		interestRateModel: ZeroInterestRateModel,
		owner: SignerWithAddress,
	) {
		const testToken = await deployERC20(name, symbol);
		// Setup CErc20Delegate implementation
		const CErc20TokenDelegate = await ethers.getContractFactory('CErc20Delegate');
		const cErc20TokenDelegate = (await CErc20TokenDelegate.deploy()) as CErc20Delegate;

		// Setup CErc20TokenDelegator storage proxy
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
		const cErc20Token = (await CErc20TokenDelegator.deploy(
			testToken.address,
			comptroller.address,
			interestRateModel.address,
			1n * DECIMAL,
			`c${name}`,
			`c${symbol}`,
			18,
			owner.address,
			cErc20TokenDelegate.address,
			'0x00',
		)) as CErc20Delegator;

		return { testToken, cErc20Token };
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

		// Setup Oracle
		const SimplePriceOracleContract = await ethers.getContractFactory('SimplePriceOracle');
		const priceOracle = (await SimplePriceOracleContract.deploy()) as SimplePriceOracle;

		await unitrollerProxy._setPriceOracle(priceOracle.address);

		return { unitrollerProxy, priceOracle };
	}

	async function deployCompoundFixture() {
		// Contracts are deployed using the first signer/account by default
		const [owner, ...otherAccount] = await ethers.getSigners();

		// Setup Controller
		const { unitrollerProxy, priceOracle } = await deployControllerFixture();

		// Setup InterestRateModel
		const ZeroInterestRateModelContract = await ethers.getContractFactory('ZeroInterestRateModel');
		const interestRateModel =
			(await ZeroInterestRateModelContract.deploy()) as ZeroInterestRateModel;

		// Setup CErc20Delegate and Erc20 TestToken
		// Setup TestTokenA Market
		const { testToken, cErc20Token } = await deployCErc20(
			'TestTokenA',
			'TTA',
			unitrollerProxy,
			interestRateModel,
			owner,
		);

		await unitrollerProxy._supportMarket(cErc20Token.address);

		return {
			owner,
			otherAccount,
			testTokenA: testToken,
			cErc20TokenA: cErc20Token,
			unitrollerProxy,
			priceOracle,
			interestRateModel,
		};
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
			const { owner, testTokenA, cErc20TokenA } = await loadFixture(deployCompoundFixture);

			const MINT_AMOUNT = 100n * DECIMAL;

			await testTokenA.approve(cErc20TokenA.address, MINT_AMOUNT);

			await cErc20TokenA.mint(MINT_AMOUNT);

			const contractBalance = await testTokenA.balanceOf(cErc20TokenA.address);

			// owner's cErc20 token balance === MINT_AMOUNT
			const balance = await cErc20TokenA.balanceOf(owner.address);

			expect(contractBalance).to.equal(MINT_AMOUNT);
			expect(balance).to.equal(MINT_AMOUNT);
		});

		it('Should redeem CErc20 Token and get TestToken', async function () {
			const { owner, testTokenA, cErc20TokenA } = await loadFixture(deployCompoundFixture);

			const MINT_AMOUNT = 100n * DECIMAL;

			await testTokenA.approve(cErc20TokenA.address, MINT_AMOUNT);

			await cErc20TokenA.mint(MINT_AMOUNT);

			await cErc20TokenA.approve(owner.address, MINT_AMOUNT);

			// owner's testTokenA increase, cErc20TokenA's testTokenA decrease
			await expect(cErc20TokenA.redeem(MINT_AMOUNT)).to.changeTokenBalances(
				testTokenA,
				[owner, cErc20TokenA],
				[MINT_AMOUNT, -MINT_AMOUNT],
			);

			// owner's cErc20 token should be 0
			const balance = await cErc20TokenA.balanceOf(owner.address);

			expect(balance).to.equal(0);
		});
	});
});
