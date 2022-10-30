import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat';
import { time } from '@nomicfoundation/hardhat-network-helpers';

import { CErc20Delegate } from '../../test-types/compound-protocol/contracts/CErc20Delegate';
import { CErc20Delegator } from '../../test-types/compound-protocol/contracts/CErc20Delegator';
import { Comptroller } from '../../test-types/compound-protocol/contracts/Comptroller';
import { Unitroller } from '../../test-types/compound-protocol/contracts/Unitroller';
import { SimplePriceOracle } from '../../test-types/compound-protocol/contracts/SimplePriceOracle';
import { ZeroInterestRateModel } from '../../test-types/contracts/Compound.sol/ZeroInterestRateModel';
import { TestToken } from '../../test-types/contracts/Compound.sol/TestToken';

import { Comp } from '../../test-types/compound-protocol/contracts/Governance/Comp';
import { GovernorBravoDelegator } from '../../test-types/compound-protocol/contracts/Governance/GovernorBravoDelegator';
import { GovernorBravoDelegate } from '../../test-types/compound-protocol/contracts/Governance/GovernorBravoDelegate';
import { Timelock } from '../../test-types/compound-protocol/contracts/Timelock';
import { GovernorAlphaZero } from '../../test-types/contracts/Compound.sol/GovernorAlphaZero';

// Use Compiled data file to specific deploy
import TestTokenData from '../../artifacts/contracts/Compound.sol/TestToken.json';
import GovernorAlphaData from '../../artifacts/compound-protocol/contracts/Governance/GovernorAlpha.sol/GovernorAlpha.json';

export const DECIMAL = 10n ** 18n;

const SEC = 1;
const MIN = 60 * SEC;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

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

	return { unitrollerProxy, priceOracle, unitrollerContract };
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
	const { unitrollerProxy, priceOracle, unitrollerContract } = await deployController();

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
		unitrollerContract,
	};
};

export const timelockExecuteTransaction = async (
	timelock: Timelock,
	target: string,
	value: number,
	signature: string,
	data: string,
) => {
	const blockTimestamps = await time.latest();

	const delay = await timelock.delay();
	const eta = blockTimestamps + delay.toNumber() + 1;

	await timelock.queueTransaction(target, value, signature, data, eta);

	await time.increaseTo(eta);

	await timelock.executeTransaction(target, value, signature, data, eta);
};

export const deployComp = async (owner: SignerWithAddress) => {
	const Comp = await ethers.getContractFactory('Comp');
	const comp = (await Comp.deploy(owner.address)) as Comp;

	return comp;
};

export const deployBravo = async (owner: SignerWithAddress) => {
	const TimelockContract = await ethers.getContractFactory('Timelock');
	const timelock = (await TimelockContract.deploy(owner.address, 2 * DAY)) as Timelock;

	const comp = await deployComp(owner);

	const GovernorAlphaZeroContract = await ethers.getContractFactory('GovernorAlphaZero');
	const governorAlphaZero = (await GovernorAlphaZeroContract.deploy()) as GovernorAlphaZero;

	const GovernorBravoDelegateContract = await ethers.getContractFactory('GovernorBravoDelegate');
	const governorBravoDelegate =
		(await GovernorBravoDelegateContract.deploy()) as GovernorBravoDelegate;

	// address timelock_,
	// address comp_,
	// address admin_,
	// address implementation_,
	// uint votingPeriod_,
	// uint votingDelay_,
	// uint proposalThreshold_
	const GovernorBravoDelegatorContract = await ethers.getContractFactory('GovernorBravoDelegator');
	const governorBravoDelegator = (await GovernorBravoDelegatorContract.deploy(
		timelock.address,
		comp.address,
		owner.address,
		governorBravoDelegate.address,
		5760, // block with 24hour
		1,
		1000n * DECIMAL,
	)) as GovernorBravoDelegator;

	// Setup Bravo Proxy let hardhat counld work
	const governorBravoProxy = (await governorBravoDelegate.attach(
		governorBravoDelegator.address,
	)) as GovernorBravoDelegate;

	return {
		governorAlpha: governorAlphaZero,
		governorBravoProxy,
		comp,
		timelock,
	};
};
