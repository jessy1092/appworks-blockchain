import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers, network } from 'hardhat';
import Bignumber from 'bignumber.js';
import { LogLevel, Logger } from '@ethersproject/logger';
import { AlphaRouter } from '@uniswap/smart-order-router';
import { Token, CurrencyAmount, TradeType, Percent } from '@uniswap/sdk-core';
import { Protocol } from '@uniswap/router-sdk';
import { Pool } from '@uniswap/v3-sdk';

import ILendingPoolData from '@aave/protocol-v2/artifacts/contracts/interfaces/ILendingPool.sol/ILendingPool.json';

import { IERC20 } from '../test-types';
import { DynamicFlashLoan } from '../test-types/contracts/DynamicFlashLoan';

import { deployCErc20WithExistERC20, deployCompound } from '@app-block/week11/test/compound/setup';
import { DECIMAL, LiqCalculator } from '@app-block/week11/test/compound/utils';

// Close warning: Duplicate definition
Logger.setLogLevel(LogLevel.ERROR);

const USDC_DECIMAL = 10n ** 6n;

const BinanceWallet = '0xF977814e90dA44bFA03b6295A0616a897441aceC';

const USDCAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const UNIAddress = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984';
const ZRXAddress = '0xE41d2489571d322189246DaFA5ebDe1F4699F498';

const AAVELendingPoolAddressesProvider = '0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5';
const AAVELendingPool = '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9';
const UniSwapRouter = '0xE592427A0AEce92De3Edee1F18E0157C05861564';
// const UniSwapRouter = '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45';

describe('Flashloan', function () {
	// We define a fixture to reuse the sayme setup in every test.
	// We use loadFixture to run this setup once, snapshot that state,
	// and reset Hardhat Network to that snapshot in every test.
	async function setupFlashLoanFixture() {
		// Contracts are deployed using the first signer/account by default

		const DynamicFlashLoanContract = await ethers.getContractFactory('DynamicFlashLoan');
		const flashLoan = (await DynamicFlashLoanContract.deploy(
			AAVELendingPoolAddressesProvider,
			AAVELendingPool,
			UniSwapRouter,
		)) as DynamicFlashLoan;

		const lendingPool = await ethers.getContractAt(ILendingPoolData.abi, AAVELendingPool);

		return { flashLoan, lendingPool };
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
		const zrxToken = (await ethers.getContractAt('IERC20', ZRXAddress)) as IERC20;

		const [user2] = await ethers.getSigners();

		// const Basic = await ethers.getContractFactory('King');
		// const basic = await Basic.deploy(otherAccount.address);

		return { user1, user2, usdcToken, uniToken, zrxToken };
	}

	async function setupCompoundFixture() {
		const { user1, user2, usdcToken, uniToken, zrxToken } = await setupForkMainnetFixture();

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

		// Setup ZRX Market
		const { cErc20Token: cZrxToken, cErc20TokenDelegate: cZrxTokenDelegate } =
			await deployCErc20WithExistERC20(
				'ZRX',
				'ZRX',
				zrxToken.address,
				unitrollerProxy,
				interestRateModel,
				user2,
			);

		await unitrollerProxy._supportMarket(cZrxToken.address);

		return {
			usdcToken,
			cUsdcToken,
			cUsdcTokenDelegate,
			uniToken,
			cUniToken,
			cUniTokenDelegate,
			zrxToken,
			cZrxToken,
			cZrxTokenDelegate,
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
			const { flashLoan } = await loadFixture(setupFlashLoanFixture);

			expect(await flashLoan.ADDRESSES_PROVIDER()).to.equal(AAVELendingPoolAddressesProvider);
			expect(await flashLoan.LENDING_POOL()).to.equal(AAVELendingPool);
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

	describe('Flashloan', function () {
		async function setupBorrowAndFlashLoanFixture() {
			const compound = await setupCompoundFixture();
			const { flashLoan, lendingPool } = await setupFlashLoanFixture();

			const { user1, priceOracle, usdcToken, cUsdcToken, uniToken, cUniToken, unitrollerProxy } =
				compound;

			// Price For USDC DECIMAL
			const USDC_PRICE_RATIO = 10n ** (18n - 6n);

			const USDCTOKEN_PRICE = 1n * DECIMAL * USDC_PRICE_RATIO;
			const UNITOKEN_PRICE = 10n * DECIMAL;
			const COLLATERAL_FACTOR = new Bignumber(0.5).multipliedBy(DECIMAL.toString());

			// Controller Setup Price: USDC = $1, UNI = $10
			await priceOracle.setUnderlyingPrice(cUsdcToken.address, USDCTOKEN_PRICE);
			await priceOracle.setUnderlyingPrice(cUniToken.address, UNITOKEN_PRICE);

			// Controller Setup Collateral factor: testTokenB 50% = 0.5
			await unitrollerProxy._setCollateralFactor(cUniToken.address, COLLATERAL_FACTOR.toString());

			// User1 Mint 1 cUSDC by 1 USDC for borrow
			const USDC_DEPOSIT_AMOUNT = 10000n * USDC_DECIMAL;
			await usdcToken.connect(user1).approve(cUsdcToken.address, USDC_DEPOSIT_AMOUNT);
			await cUsdcToken.connect(user1).mint(USDC_DEPOSIT_AMOUNT);

			// const cUsdcTokenBalance = await cUsdcToken.balanceOf(user1.address);
			// console.log('cUSDC balance:', cUsdcTokenBalance);

			// 設置最大清算 factor
			const CLOSE_FACTOR = new Bignumber(0.5).multipliedBy(DECIMAL.toString());
			await unitrollerProxy._setCloseFactor(CLOSE_FACTOR.toString());

			// 設置清算獎勵 % > 1
			const LIQUIDATION_INCENTIVE = new Bignumber(1.08).multipliedBy(DECIMAL.toString());
			await unitrollerProxy._setLiquidationIncentive(LIQUIDATION_INCENTIVE.toString());

			// Protocal 清算抽成 protocolSeizeShareMantissa = 2.8%
			const PROTOCOL_SEIZE_SHARE = new Bignumber(0.028).multipliedBy(DECIMAL.toString());

			// ------ User Setup ------
			// User Setup asset enter market as collateral (by user)
			await unitrollerProxy.connect(user1).enterMarkets([cUniToken.address]);

			// User Setup deposit: UNI 1000
			const UNI_DEPOSIT_AMOUNT = 1000n * DECIMAL;
			await uniToken.connect(user1).approve(cUniToken.address, UNI_DEPOSIT_AMOUNT);
			await cUniToken.connect(user1).mint(UNI_DEPOSIT_AMOUNT);

			// User borrow tokenA
			const USDC_BORROW_AMOUNT = 5000n * USDC_DECIMAL;
			await cUsdcToken.connect(user1).borrow(USDC_BORROW_AMOUNT);

			// ------ Liquidity Setup ------
			// decrease tokenB oracle price
			const NEW_UNITOKEN_PRICE = (62n * DECIMAL) / 10n;
			await priceOracle.setUnderlyingPrice(cUniToken.address, NEW_UNITOKEN_PRICE);

			// const result = await unitrollerProxy.getAccountLiquidity(user1.address);
			// const shortfall = result[2];

			const uniTokenExchangeRate = await cUniToken.exchangeRateStored();

			// Setup calculator
			const liqCalculator = new LiqCalculator(
				CLOSE_FACTOR,
				LIQUIDATION_INCENTIVE,
				PROTOCOL_SEIZE_SHARE,
			);

			liqCalculator.addToken({
				name: 'USDCToken',
				price: new Bignumber(USDCTOKEN_PRICE.toString()),
				exchangeRate: new Bignumber(0), // not use
			});

			liqCalculator.addToken({
				name: 'UNIToken',
				price: new Bignumber(NEW_UNITOKEN_PRICE.toString()),
				exchangeRate: new Bignumber(uniTokenExchangeRate.toString()),
			});

			const repayAmount = liqCalculator.getRepayAmount(
				'USDCToken',
				new Bignumber(((USDC_BORROW_AMOUNT * USDCTOKEN_PRICE) / DECIMAL).toString()),
			);

			const { seizeTokens, liquidatorSeizeTokens } = liqCalculator.getSeize(
				'USDCToken',
				'UNIToken',
				repayAmount,
			);

			return {
				...compound,
				CLOSE_FACTOR,
				LIQUIDATION_INCENTIVE,
				USDCTOKEN_PRICE,
				UNITOKEN_PRICE,
				PROTOCOL_SEIZE_SHARE,
				seizeTokens,
				liquidatorSeizeTokens,
				repayAmount,
				flashLoan,
				lendingPool,
			};
		}

		async function setupBorrowAndFlashLoanWithMultiRouteFixture() {
			const compound = await setupCompoundFixture();
			const { flashLoan, lendingPool } = await setupFlashLoanFixture();

			const { user1, priceOracle, usdcToken, cUsdcToken, zrxToken, cZrxToken, unitrollerProxy } =
				compound;

			// Price For USDC DECIMAL
			const USDC_PRICE_RATIO = 10n ** (18n - 6n);

			const USDCTOKEN_PRICE = 1n * DECIMAL * USDC_PRICE_RATIO;
			const ZRXTOKEN_PRICE = (24n * DECIMAL) / 100n;
			const COLLATERAL_FACTOR = new Bignumber(0.5).multipliedBy(DECIMAL.toString());

			// Controller Setup Price: USDC = $1, ZRX = $0.24
			await priceOracle.setUnderlyingPrice(cUsdcToken.address, USDCTOKEN_PRICE);
			await priceOracle.setUnderlyingPrice(cZrxToken.address, ZRXTOKEN_PRICE);

			// Controller Setup Collateral factor: testTokenB 50% = 0.5
			await unitrollerProxy._setCollateralFactor(cZrxToken.address, COLLATERAL_FACTOR.toString());

			// User1 Mint 1 cUSDC by 1 USDC for borrow
			const USDC_DEPOSIT_AMOUNT = 10000n * USDC_DECIMAL;
			await usdcToken.connect(user1).approve(cUsdcToken.address, USDC_DEPOSIT_AMOUNT);
			await cUsdcToken.connect(user1).mint(USDC_DEPOSIT_AMOUNT);

			// const cUsdcTokenBalance = await cUsdcToken.balanceOf(user1.address);
			// console.log('cUSDC balance:', cUsdcTokenBalance);

			// 設置最大清算 factor
			const CLOSE_FACTOR = new Bignumber(0.5).multipliedBy(DECIMAL.toString());
			await unitrollerProxy._setCloseFactor(CLOSE_FACTOR.toString());

			// 設置清算獎勵 % > 1
			const LIQUIDATION_INCENTIVE = new Bignumber(1.08).multipliedBy(DECIMAL.toString());
			await unitrollerProxy._setLiquidationIncentive(LIQUIDATION_INCENTIVE.toString());

			// Protocal 清算抽成 protocolSeizeShareMantissa = 2.8%
			const PROTOCOL_SEIZE_SHARE = new Bignumber(0.028).multipliedBy(DECIMAL.toString());

			// ------ User Setup ------
			// User Setup asset enter market as collateral (by user)
			await unitrollerProxy.connect(user1).enterMarkets([cZrxToken.address]);

			// User Setup deposit: ZRX 40000 * 0.24 = 9600
			const ZRX_DEPOSIT_AMOUNT = 40000n * DECIMAL;
			await zrxToken.connect(user1).approve(cZrxToken.address, ZRX_DEPOSIT_AMOUNT);
			await cZrxToken.connect(user1).mint(ZRX_DEPOSIT_AMOUNT);

			// User borrow tokenA
			const USDC_BORROW_AMOUNT = 4800n * USDC_DECIMAL;
			await cUsdcToken.connect(user1).borrow(USDC_BORROW_AMOUNT);

			// ------ Liquidity Setup ------
			// decrease tokenB oracle price
			const NEW_ZRXTOKEN_PRICE = (12n * DECIMAL) / 100n;
			await priceOracle.setUnderlyingPrice(cZrxToken.address, NEW_ZRXTOKEN_PRICE);

			// const result = await unitrollerProxy.getAccountLiquidity(user1.address);
			// const shortfall = result[2];

			const zrxTokenExchangeRate = await cZrxToken.exchangeRateStored();

			// Setup calculator
			const liqCalculator = new LiqCalculator(
				CLOSE_FACTOR,
				LIQUIDATION_INCENTIVE,
				PROTOCOL_SEIZE_SHARE,
			);

			liqCalculator.addToken({
				name: 'USDCToken',
				price: new Bignumber(USDCTOKEN_PRICE.toString()),
				exchangeRate: new Bignumber(0), // not use
			});

			liqCalculator.addToken({
				name: 'ZRXToken',
				price: new Bignumber(NEW_ZRXTOKEN_PRICE.toString()),
				exchangeRate: new Bignumber(zrxTokenExchangeRate.toString()),
			});

			const repayAmount = liqCalculator.getRepayAmount(
				'USDCToken',
				new Bignumber(((USDC_BORROW_AMOUNT * USDCTOKEN_PRICE) / DECIMAL).toString()),
			);

			const { seizeTokens, liquidatorSeizeTokens } = liqCalculator.getSeize(
				'USDCToken',
				'ZRXToken',
				repayAmount,
			);

			return {
				...compound,
				CLOSE_FACTOR,
				LIQUIDATION_INCENTIVE,
				USDCTOKEN_PRICE,
				ZRXTOKEN_PRICE,
				PROTOCOL_SEIZE_SHARE,
				seizeTokens,
				liquidatorSeizeTokens,
				repayAmount,
				flashLoan,
				lendingPool,
			};
		}

		it('Could liquidate user who have shortfall when uni decrease $6.2', async function () {
			const {
				user1,
				user2,
				usdcToken,
				cUsdcToken,
				uniToken,
				cUniToken,
				flashLoan,
				repayAmount,
				seizeTokens,
				lendingPool,
			} = await loadFixture(setupBorrowAndFlashLoanFixture);

			const router = new AlphaRouter({
				chainId: 1,
				provider: ethers.provider,
			});

			const UNI = new Token(1, uniToken.address, 18, 'UNI', 'Uniswap');
			const USDC = new Token(1, usdcToken.address, 6, 'USDC', 'USD Coin');

			const uniTokens = CurrencyAmount.fromRawAmount(UNI, seizeTokens.toString());

			const route = await router.route(
				uniTokens,
				USDC,
				TradeType.EXACT_INPUT,
				{
					recipient: user2.address,
					slippageTolerance: new Percent(5, 100),
					deadline: Math.floor(Date.now() / 1000 + 1800),
				},
				{
					protocols: [Protocol.V3],
				},
			);

			const combineRoutes = [];
			const combineRoutesTypes = [];
			const tokenPath = route?.trade.routes[0].path;
			const pools = route?.trade.routes[0].pools as Pool[];

			if (tokenPath && pools) {
				for (let i = 0; i < tokenPath.length - 1; i++) {
					combineRoutes[i * 2] = tokenPath[i].address;
					combineRoutesTypes[i * 2] = 'address';

					combineRoutes[i * 2 + 1] = pools[i].fee;
					combineRoutesTypes[i * 2 + 1] = 'uint24';
				}

				combineRoutes.push(tokenPath[tokenPath.length - 1].address);
				combineRoutesTypes.push('address');
			}

			// console.log(JSON.stringify(route?.trade.routes[0].path));
			// console.log(route?.methodParameters?.calldata);

			// console.log(combineRoutes);
			// console.log(ethers.utils.solidityPack(combineRoutesTypes, combineRoutes));

			const abi = new ethers.utils.AbiCoder();

			// For fake pass
			// await usdcToken.transfer(flashLoan.address, repayAmount.toString());
			// console.log(repayAmount.toString());

			// 		receiverAddress,
			// 		assets,
			// 		amounts,
			// 		modes,
			// 		onBehalfOf,
			// 		params => address borrower, address liquidateAddress, address rewardAddress, address rewardErc20Address
			// 		referralCode

			await expect(
				lendingPool
					.connect(user2)
					.flashLoan(
						flashLoan.address,
						[usdcToken.address],
						[repayAmount.toString()],
						[0],
						'0x0000000000000000000000000000000000000000',
						abi.encode(
							['address', 'address', 'address', 'address', 'bytes'],
							[
								user1.address,
								cUsdcToken.address,
								cUniToken.address,
								uniToken.address,
								ethers.utils.solidityPack(combineRoutesTypes, combineRoutes),
							],
						),
						0,
					),
			)
				.to.changeTokenBalance(usdcToken, flashLoan.address, 2623989940 - 2502250000)
				.to.emit(flashLoan, 'FlashLoanSuccess')
				.withArgs(2623989940, 2502250000);

			const earnReward = 2623989940 - 2502250000;

			await expect(
				flashLoan.connect(user2).withdraw(usdcToken.address, earnReward),
			).to.changeTokenBalances(usdcToken, [flashLoan, user2], [-earnReward, earnReward]);

			expect(true).to.equal(true);

			// console.log('Earn', earnReward);
			// 121739940
			// 2502250000;
			// 2623989940;
			// 2500000000;
		});

		it('Could liquidate user who have shortfall when zrx decrease $0.12', async function () {
			const {
				user1,
				user2,
				usdcToken,
				cUsdcToken,
				zrxToken,
				cZrxToken,
				flashLoan,
				repayAmount,
				seizeTokens,
				lendingPool,
			} = await loadFixture(setupBorrowAndFlashLoanWithMultiRouteFixture);

			const router = new AlphaRouter({
				chainId: 1,
				provider: ethers.provider,
			});

			// const UNI = new Token(1, uniToken.address, 18, 'UNI', 'Uniswap');
			const USDC = new Token(1, usdcToken.address, 6, 'USDC', 'USD Coin');
			const ZRX = new Token(
				1,
				'0xE41d2489571d322189246DaFA5ebDe1F4699F498',
				18,
				'ZRX',
				'0x Protocol Token',
			);

			// Prevent exponential
			Bignumber.config({ EXPONENTIAL_AT: [0, 40] });
			// console.log('check', seizeTokens.toString());

			const zrxTokens = CurrencyAmount.fromRawAmount(ZRX, seizeTokens.toString());

			const route = await router.route(
				zrxTokens,
				USDC,
				TradeType.EXACT_INPUT,
				{
					recipient: user2.address,
					slippageTolerance: new Percent(5, 100),
					deadline: Math.floor(Date.now() / 1000 + 1800),
				},
				{
					protocols: [Protocol.V3],
				},
			);

			const combineRoutes = [];
			const combineRoutesTypes = [];
			const tokenPath = route?.trade.routes[0].path;
			const pools = route?.trade.routes[0].pools as Pool[];

			if (tokenPath && pools) {
				for (let i = 0; i < tokenPath.length - 1; i++) {
					combineRoutes[i * 2] = tokenPath[i].address;
					combineRoutesTypes[i * 2] = 'address';

					combineRoutes[i * 2 + 1] = pools[i].fee;
					combineRoutesTypes[i * 2 + 1] = 'uint24';
				}

				combineRoutes.push(tokenPath[tokenPath.length - 1].address);
				combineRoutesTypes.push('address');
			}

			// console.log(JSON.stringify(route?.trade.routes[0].path));
			// console.log(route?.methodParameters?.calldata);

			// console.log(combineRoutes);
			// console.log(ethers.utils.solidityPack(combineRoutesTypes, combineRoutes));

			expect(combineRoutes).to.eqls([
				'0xE41d2489571d322189246DaFA5ebDe1F4699F498', // ZRX
				3000,
				'0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
				500,
				'0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
			]);

			const abi = new ethers.utils.AbiCoder();

			// For fake pass
			// await usdcToken.transfer(flashLoan.address, repayAmount.toString());
			// console.log(repayAmount.toString());

			// 		receiverAddress,
			// 		assets,
			// 		amounts,
			// 		modes,
			// 		onBehalfOf,
			// 		params => address borrower, address liquidateAddress, address rewardAddress, address rewardErc20Address
			// 		referralCode

			await expect(
				lendingPool
					.connect(user2)
					.flashLoan(
						flashLoan.address,
						[usdcToken.address],
						[repayAmount.toString()],
						[0],
						'0x0000000000000000000000000000000000000000',
						abi.encode(
							['address', 'address', 'address', 'address', 'bytes'],
							[
								user1.address,
								cUsdcToken.address,
								cZrxToken.address,
								zrxToken.address,
								ethers.utils.solidityPack(combineRoutesTypes, combineRoutes),
							],
						),
						0,
					),
			)
				.to.changeTokenBalance(usdcToken, flashLoan.address, 5054847924 - 2402160000)
				.to.emit(flashLoan, 'FlashLoanSuccess')
				.withArgs(5054847924, 2402160000);

			const earnReward = 5054847924 - 2402160000;

			await expect(
				flashLoan.connect(user2).withdraw(usdcToken.address, earnReward),
			).to.changeTokenBalances(usdcToken, [flashLoan, user2], [-earnReward, earnReward]);

			expect(true).to.equal(true);

			// console.log('Earn', earnReward);
			// 2652687924
			// 2402160000;
			// 5054847924;
			// 2400000000;
		});
	});
});
