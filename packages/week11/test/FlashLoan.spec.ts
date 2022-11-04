import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers, network } from 'hardhat';
import Bignumber from 'bignumber.js';

import ILendingPoolData from '@aave/protocol-v2/artifacts/contracts/interfaces/ILendingPool.sol/ILendingPool.json';

import { ERC20 } from '../test-types';
import { CompoundFlashLoan } from '../test-types/contracts/FlashLoan.sol';

import { deployCErc20WithExistERC20, deployCompound } from './compound/setup';
import { DECIMAL, LiqCalculator } from './compound/utils';

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

		const usdcToken = (await ethers.getContractAt('ERC20', USDCAddress)) as ERC20;
		const uniToken = (await ethers.getContractAt('ERC20', UNIAddress)) as ERC20;

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

	describe('Compound Borrow', function () {
		async function setupBorrowFixture() {
			const compound = await setupCompoundFixture();

			const { user1, priceOracle, usdcToken, cUsdcToken, cUniToken, unitrollerProxy } = compound;

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
			const CLOSE_FACTOR = new Bignumber(0.9).multipliedBy(DECIMAL.toString());
			await unitrollerProxy._setCloseFactor(CLOSE_FACTOR.toString());

			// 設置清算獎勵 % > 1
			const LIQUIDATION_INCENTIVE = new Bignumber(1.08).multipliedBy(DECIMAL.toString());
			await unitrollerProxy._setLiquidationIncentive(LIQUIDATION_INCENTIVE.toString());

			// Protocal 清算抽成 protocolSeizeShareMantissa = 2.8%
			const PROTOCOL_SEIZE_SHARE = new Bignumber(0.028).multipliedBy(DECIMAL.toString());

			return {
				...compound,
				CLOSE_FACTOR,
				LIQUIDATION_INCENTIVE,
				USDCTOKEN_PRICE,
				UNITOKEN_PRICE,
				PROTOCOL_SEIZE_SHARE,
			};
		}

		it('Should borrow the usdc by using uni as collateral', async function () {
			const { user1, usdcToken, cUsdcToken, unitrollerProxy, uniToken, cUniToken } =
				await loadFixture(setupBorrowFixture);

			// User Setup asset enter market as collateral (by user)
			await unitrollerProxy.connect(user1).enterMarkets([cUniToken.address]);

			// User Setup deposit: UNI 1000
			const UNI_DEPOSIT_AMOUNT = 1000n * DECIMAL;
			await uniToken.connect(user1).approve(cUniToken.address, UNI_DEPOSIT_AMOUNT);
			await cUniToken.connect(user1).mint(UNI_DEPOSIT_AMOUNT);

			// User borrow usdc
			const USDC_BORROW_AMOUNT = 5000n * USDC_DECIMAL;

			await expect(cUsdcToken.connect(user1).borrow(USDC_BORROW_AMOUNT)).to.changeTokenBalances(
				usdcToken,
				[cUsdcToken, user1],
				[-USDC_BORROW_AMOUNT, USDC_BORROW_AMOUNT],
			);
		});

		it('Should has shortfall if uni decrease $6.2', async function () {
			const { user1, cUsdcToken, unitrollerProxy, uniToken, cUniToken, priceOracle } =
				await loadFixture(setupBorrowFixture);

			// User Setup asset enter market as collateral (by user)
			await unitrollerProxy.connect(user1).enterMarkets([cUniToken.address]);

			// User Setup deposit: UNI 1000
			const UNI_DEPOSIT_AMOUNT = 1000n * DECIMAL;
			await uniToken.connect(user1).approve(cUniToken.address, UNI_DEPOSIT_AMOUNT);
			await cUniToken.connect(user1).mint(UNI_DEPOSIT_AMOUNT);

			// const result1 = await unitrollerProxy.getAccountLiquidity(user1.address);
			// console.log('not borrow liquidity', result1);

			// User borrow tokenA
			const USDC_BORROW_AMOUNT = 5000n * USDC_DECIMAL;
			await cUsdcToken.connect(user1).borrow(USDC_BORROW_AMOUNT);

			// decrease tokenB oracle price
			const NEW_UNITOKEN_PRICE = (62n * DECIMAL) / 10n;
			await priceOracle.setUnderlyingPrice(cUniToken.address, NEW_UNITOKEN_PRICE);

			const result = await unitrollerProxy.getAccountLiquidity(user1.address);

			const shortfall = result[2];

			expect(shortfall).to.gt(0);
		});

		it('Could liquidate user who have shortfall when uni decrease $6.2', async function () {
			const {
				user1,
				user2,
				usdcToken,
				cUsdcToken,
				unitrollerProxy,
				uniToken,
				cUniToken,
				CLOSE_FACTOR,
				LIQUIDATION_INCENTIVE,
				PROTOCOL_SEIZE_SHARE,
				USDCTOKEN_PRICE,
				priceOracle,
			} = await loadFixture(setupBorrowFixture);

			await usdcToken.connect(user1).transfer(user2.address, 10000n * USDC_DECIMAL);

			// User Setup asset enter market as collateral (by user)
			await unitrollerProxy.connect(user1).enterMarkets([cUniToken.address]);

			// User Setup deposit: UNI 1000
			const UNI_DEPOSIT_AMOUNT = 1000n * DECIMAL;
			await uniToken.connect(user1).approve(cUniToken.address, UNI_DEPOSIT_AMOUNT);
			await cUniToken.connect(user1).mint(UNI_DEPOSIT_AMOUNT);

			// const result1 = await unitrollerProxy.getAccountLiquidity(user1.address);
			// console.log('not borrow liquidity', result1);

			// User borrow tokenA
			const USDC_BORROW_AMOUNT = 5000n * USDC_DECIMAL;
			await cUsdcToken.connect(user1).borrow(USDC_BORROW_AMOUNT);

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

			await usdcToken.connect(user2).approve(cUsdcToken.address, repayAmount.toString());

			const { seizeTokens, liquidatorSeizeTokens } = liqCalculator.getSeize(
				'USDCToken',
				'UNIToken',
				repayAmount,
			);

			// console.log('repay?', repayAmount);

			await expect(
				cUsdcToken
					.connect(user2)
					.liquidateBorrow(user1.address, repayAmount.toString(), cUniToken.address),
			)
				.to.changeTokenBalances(
					usdcToken,
					[cUsdcToken, user2],
					[repayAmount.toString(), repayAmount.negated().toString()],
				)
				.to.changeTokenBalances(
					cUniToken,
					[user2, user1],
					[liquidatorSeizeTokens.toString(), seizeTokens.negated().toString()],
				);
		});
	});

	describe('Flashloan', function () {
		async function setupBorrowAndFlashLoanFixture() {
			const compound = await setupCompoundFixture();
			const { compoundFlashLoan, lendingPool } = await setupFlashLoanFixture();

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
			const CLOSE_FACTOR = new Bignumber(0.9).multipliedBy(DECIMAL.toString());
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

			const result = await unitrollerProxy.getAccountLiquidity(user1.address);

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
				compoundFlashLoan,
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
				compoundFlashLoan,
				repayAmount,
				lendingPool,
			} = await loadFixture(setupBorrowAndFlashLoanFixture);

			const abi = new ethers.utils.AbiCoder();

			// For fake pass
			// await usdcToken.transfer(compoundFlashLoan.address, repayAmount.toString());
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
						compoundFlashLoan.address,
						[usdcToken.address],
						[repayAmount.toString()],
						[0],
						'0x0000000000000000000000000000000000000000',
						abi.encode(
							['address', 'address', 'address', 'address'],
							[user1.address, cUsdcToken.address, cUniToken.address, uniToken.address],
						),
						0,
					),
			)
				.to.emit(compoundFlashLoan, 'FlashLoanSuccess')
				.withArgs(4721996686, 4504050000)
				.to.changeTokenBalance(usdcToken, compoundFlashLoan.address, 4721996686 - 4504050000);

			const earnReward = 4721996686 - 4504050000;

			await expect(
				compoundFlashLoan.connect(user2).withdraw(usdcToken.address, earnReward),
			).to.changeTokenBalances(usdcToken, [compoundFlashLoan, user2], [-earnReward, earnReward]);

			// console.log('Earn', 4721996686 - 4504050000);
			// 217946686
			// 4504050000;
			// 4721996686;
			// 4500000000;
		});
	});
});
