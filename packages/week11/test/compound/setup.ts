import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat';

import { CErc20Delegate } from '../../test-types/compound-protocol/contracts/CErc20Delegate';
import { CErc20Delegator } from '../../test-types/compound-protocol/contracts/CErc20Delegator';
import { Comptroller } from '../../test-types/compound-protocol/contracts/Comptroller';
import { Unitroller } from '../../test-types/compound-protocol/contracts/Unitroller';
import { SimplePriceOracle } from '../../test-types/compound-protocol/contracts/SimplePriceOracle';

import { ZeroInterestRateModel } from '../../test-types/contracts/Compound.sol/ZeroInterestRateModel';
import { TestToken } from '../../test-types/contracts/Compound.sol/TestToken';

// Use Compiled data file to specific deploy
import TestTokenData from '../../artifacts/contracts/Compound.sol/TestToken.json';

export const DECIMAL = 10n ** 18n;

export const deployERC20 = async (name: string, symbol: string): Promise<TestToken> => {
	const TestToken = await ethers.getContractFactory(TestTokenData.abi, TestTokenData.bytecode);
	const testToken = (await TestToken.deploy(name, symbol)) as TestToken;

	return testToken;
};

export const deployController = async () => {
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
};

export const deployCErc20 = async (
	name: string,
	symbol: string,
	comptroller: Comptroller,
	interestRateModel: ZeroInterestRateModel,
	owner: SignerWithAddress,
) => {
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

	// cErc20TokenDelegate for check error
	return { testToken, cErc20Token, cErc20TokenDelegate };
};

export const deployCompound = async (owner: SignerWithAddress) => {
	// Setup Controller
	const { unitrollerProxy, priceOracle } = await deployController();

	// Setup InterestRateModel
	const ZeroInterestRateModelContract = await ethers.getContractFactory('ZeroInterestRateModel');
	const interestRateModel = (await ZeroInterestRateModelContract.deploy()) as ZeroInterestRateModel;

	// Setup CErc20Delegate and Erc20 TestToken
	// Setup TestTokenA Market
	const { testToken, cErc20Token, cErc20TokenDelegate } = await deployCErc20(
		'TestTokenA',
		'TTA',
		unitrollerProxy,
		interestRateModel,
		owner,
	);

	await unitrollerProxy._supportMarket(cErc20Token.address);

	return {
		testTokenA: testToken,
		cErc20TokenA: cErc20Token,
		cErc20TokenADelegate: cErc20TokenDelegate,
		unitrollerProxy,
		priceOracle,
		interestRateModel,
	};
};
