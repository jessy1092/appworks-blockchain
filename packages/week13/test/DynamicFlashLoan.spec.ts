import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers, network } from 'hardhat';
import Bignumber from 'bignumber.js';
import { LogLevel, Logger } from '@ethersproject/logger';

import ILendingPoolData from '@aave/protocol-v2/artifacts/contracts/interfaces/ILendingPool.sol/ILendingPool.json';

import { IERC20 } from '../test-types';
import { CompoundFlashLoan } from '../test-types/@app-block/week11/contracts/FlashLoan.sol';

import { deployCErc20WithExistERC20, deployCompound } from '@app-block/week11/test/compound/setup';
import { DECIMAL, LiqCalculator } from '@app-block/week11/test/compound/utils';

// Close warning: Duplicate definition
Logger.setLogLevel(LogLevel.ERROR);

const USDC_DECIMAL = 10n ** 6n;

const BinanceWallet = '0xF977814e90dA44bFA03b6295A0616a897441aceC';

const USDCAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const UNIAddress = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984';

const AAVELendingPoolAddressesProvider = '0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5';
const AAVELendingPool = '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9';
const AAVESwapRouter = '0xE592427A0AEce92De3Edee1F18E0157C05861564';

describe('Flashloan', function () {
	// We define a fixture to reuse the sayme setup in every test.
	// We use loadFixture to run this setup once, snapshot that state,
	// and reset Hardhat Network to that snapshot in every test.
	async function setupFlashLoanFixture() {
		// Contracts are deployed using the first signer/account by default

		const CompoundFlashLoanContract = await ethers.getContractFactory('CompoundFlashLoan');
		const compoundFlashLoan = (await CompoundFlashLoanContract.deploy(
			AAVELendingPoolAddressesProvider,
			AAVELendingPool,
			AAVESwapRouter,
		)) as CompoundFlashLoan;

		const lendingPool = await ethers.getContractAt(ILendingPoolData.abi, AAVELendingPool);

		return { compoundFlashLoan, lendingPool };
	}

	async function setupForkMainnetFixture() {
		// Contracts are deployed using the first signer/account by default

		await network.provider.request({
			method: 'hardhat_impersonateAccount',
			params: [BinanceWallet],
		});
		const user1 = await ethers.getSigner(BinanceWallet);

		const usdcToken = (await ethers.getContractAt('IERC20', USDCAddress)) as IERC20;
		const uniToken = (await ethers.getContractAt('IERC20', UNIAddress)) as IERC20;

		const [user2] = await ethers.getSigners();

		// const Basic = await ethers.getContractFactory('King');
		// const basic = await Basic.deploy(otherAccount.address);

		return { user1, user2, usdcToken, uniToken };
	}

	async function setupCompoundFixture() {
		const { user1, user2, usdcToken, uniToken } = await setupForkMainnetFixture();

		const { unitrollerProxy, priceOracle, interestRateModel, unitrollerContract } =
			await deployCompound();

		// Setup CErc20Delegate and Erc20 TestToken
		// Setup USDC Market
		const { cErc20Token: cUsdcToken, cErc20TokenDelegate: cUsdcTokenDelegate } =
			await deployCErc20WithExistERC20(
				'USDC',
				'USDC',
				usdcToken.address,
				unitrollerProxy,
				interestRateModel,
				user2,
			);

		await unitrollerProxy._supportMarket(cUsdcToken.address);

		// Setup CErc20Delegate and Erc20 TestToken
		// Setup UNI Market
		const { cErc20Token: cUniToken, cErc20TokenDelegate: cUniTokenDelegate } =
			await deployCErc20WithExistERC20(
				'UNI',
				'UNI',
				uniToken.address,
				unitrollerProxy,
				interestRateModel,
				user2,
			);

		await unitrollerProxy._supportMarket(cUniToken.address);

		return {
			usdcToken,
			cUsdcToken,
			cUsdcTokenDelegate,
			uniToken,
			cUniToken,
			cUniTokenDelegate,
			unitrollerProxy,
			priceOracle,
			interestRateModel,
			unitrollerContract,
			user1,
			user2,
		};
	}

	describe('Deployment', function () {
		it('Should set the right provider and landing pool', async function () {
			const { compoundFlashLoan } = await loadFixture(setupFlashLoanFixture);

			expect(await compoundFlashLoan.ADDRESSES_PROVIDER()).to.equal(
				AAVELendingPoolAddressesProvider,
			);
			expect(await compoundFlashLoan.LENDING_POOL()).to.equal(AAVELendingPool);
		});

		it('Should could impersonate Account', async function () {
			const { user1, usdcToken } = await loadFixture(setupForkMainnetFixture);

			let balance = await usdcToken.balanceOf(user1.address);

			expect(balance).to.gt(0);
		});

		it('Should set the right owner', async function () {
			const { user2, cUsdcToken } = await loadFixture(setupCompoundFixture);

			expect(await cUsdcToken.admin()).to.equal(user2.address);
		});
	});
});
