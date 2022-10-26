import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import BigNumber from 'bignumber.js';

import { CErc20Delegate } from '../test-types/compound-protocol/contracts/CErc20Delegate';
import { CErc20Delegator } from '../test-types/compound-protocol/contracts/CErc20Delegator';
import { Comptroller } from '../test-types/compound-protocol/contracts/Comptroller';
import { Unitroller } from '../test-types/compound-protocol/contracts/Unitroller';
import { SimplePriceOracle } from '../test-types/compound-protocol/contracts/SimplePriceOracle';
import { ZeroInterestRateModel } from '../test-types/contracts/Compound.sol/ZeroInterestRateModel';
import { TestToken } from '../test-types/contracts/Compound.sol/TestToken';

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

	async function deployCompoundFixture() {
		// Contracts are deployed using the first signer/account by default
		const { owner, otherAccount, testToken } = await deployERC20Fixture();

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
			unitrollerContract.address,
			zeroInterestRateModelContract.address,
			1,
			'cTestToken',
			'cTT',
			18,
			owner.address,
			cErc20TokenDelegate.address,
			'0x00',
		)) as CErc20Delegator;

		await unitrollerProxy._setPriceOracle(simplePriceOracleContract.address);

		return { owner, otherAccount, testToken, unitrollerProxy, cErc20TokenDelegator };
	}

	describe('Deployment', function () {
		it('Should set the right admin', async function () {
			const { owner, unitrollerProxy } = await loadFixture(deployCompoundFixture);
			expect(await unitrollerProxy.admin()).to.equal(owner.address);
		});

		it('Should have TestToken', async function () {
			const { owner, testToken } = await loadFixture(deployCompoundFixture);
			const balance = await testToken.balanceOf(owner.address);
			expect(new BigNumber(balance.toString()).toString()).to.equal(
				new BigNumber(100000000).multipliedBy(new BigNumber(10).exponentiatedBy(18)).toString(),
			);
		});
	});
});
