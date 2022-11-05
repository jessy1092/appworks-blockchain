import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import Bignumber from 'bignumber.js';

import { deployCErc20, deployCompoundWithOneMarket, deployERC20 } from './setup';
import { DECIMAL, LiqCalculator } from './utils';

describe('Compound', function () {
	// We define a fixture to reuse the same setup in every test.
	// We use loadFixture to run this setup once, snapshot that state,
	// and reset Hardhat Network to that snapshot in every test.
	async function deployERC20Fixture() {
		const [owner, ...otherAccount] = await ethers.getSigners();

		const testToken = await deployERC20('TestToken', 'TT');

		return { owner, otherAccount, testToken };
	}

	async function deployCompoundFixture() {
		// Contracts are deployed using the first signer/account by default
		const [owner, ...otherAccount] = await ethers.getSigners();

		const compound = await deployCompoundWithOneMarket(owner);

		return {
			owner,
			otherAccount,
			...compound,
		};
	}

	async function deployCompoundWithMultiMarketFixture() {
		const [owner, ...otherAccount] = await ethers.getSigners();

		const compound = await deployCompoundWithOneMarket(owner);

		const { unitrollerProxy, interestRateModel } = compound;

		// Setup TestTokenB Market
		const { testToken, cErc20Token, cErc20TokenDelegate } = await deployCErc20(
			'TestTokenB',
			'TTB',
			unitrollerProxy,
			interestRateModel,
			owner,
		);

		await unitrollerProxy._supportMarket(cErc20Token.address);

		return {
			owner,
			otherAccount,
			...compound,
			testTokenB: testToken,
			cErc20TokenB: cErc20Token,
			cErc20TokenBDelegate: cErc20TokenDelegate,
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

	describe('borrow/repay', function () {
		async function setupBorrowRepayFixture() {
			const compound = await deployCompoundWithMultiMarketFixture();

			const { priceOracle, cErc20TokenA, cErc20TokenB, unitrollerProxy } = compound;

			const TESTTOKENA_PRICE = 1n * DECIMAL;
			const TESTTOKENB_PRICE = 100n * DECIMAL;
			const COLLATERAL_FACTOR = new Bignumber(0.5).multipliedBy(DECIMAL.toString()).toString();

			// Controller Setup Price: testTokenA = $1, testTokenB = $100
			await priceOracle.setUnderlyingPrice(cErc20TokenA.address, TESTTOKENA_PRICE);
			await priceOracle.setUnderlyingPrice(cErc20TokenB.address, TESTTOKENB_PRICE);

			// Controller Setup Collateral factor: testTokenB 50% = 0.5
			await unitrollerProxy._setCollateralFactor(cErc20TokenB.address, COLLATERAL_FACTOR);

			return { ...compound, COLLATERAL_FACTOR };
		}

		it('Should setup TestTokenB collateral factor', async function () {
			const { cErc20TokenB, unitrollerProxy, COLLATERAL_FACTOR } = await loadFixture(
				setupBorrowRepayFixture,
			);

			const market = await unitrollerProxy.markets(cErc20TokenB.address);

			expect(market.collateralFactorMantissa).to.equal(COLLATERAL_FACTOR);
		});

		it('Should borrow TestTokenA when TestTokenB as collateral', async function () {
			const { owner, testTokenA, cErc20TokenA, testTokenB, cErc20TokenB, unitrollerProxy } =
				await loadFixture(setupBorrowRepayFixture);

			// User Setup asset enter market as collateral (by user)
			await unitrollerProxy.enterMarkets([cErc20TokenB.address]);

			const assets = await unitrollerProxy.getAssetsIn(owner.address);

			// check asset can be as collateral
			expect(assets).to.eqls([cErc20TokenB.address]);

			// User Setup deposit: testTokenA 100
			const TESTTOKENA_DEPOSIT_AMOUNT = 100n * DECIMAL;
			await testTokenA.approve(cErc20TokenA.address, TESTTOKENA_DEPOSIT_AMOUNT);
			await cErc20TokenA.mint(TESTTOKENA_DEPOSIT_AMOUNT);

			// Mint 1 cErc20TokenB by 1 testTokenB
			const TESTTOKENB_DEPOSIT_AMOUNT = 1n * DECIMAL;
			await testTokenB.approve(cErc20TokenB.address, TESTTOKENB_DEPOSIT_AMOUNT);
			await cErc20TokenB.mint(TESTTOKENB_DEPOSIT_AMOUNT);

			const TESTTOKENA_BORROW_AMOUNT = 50n * DECIMAL;

			// Check liquidity
			// const liquidity = await unitrollerProxy.getAccountLiquidity(owner.address);

			// console.log(JSON.stringify(liquidity));

			// const result = await unitrollerProxy.getHypotheticalAccountLiquidity(
			// 	owner.address,
			// 	cErc20TokenA.address,
			// 	0,
			// 	TESTTOKENA_BORROW_AMOUNT,
			// );

			// console.log(JSON.stringify(result));

			// owner's testTokenA increase, cErc20TokenA's testTokenA decrease
			await expect(cErc20TokenA.borrow(TESTTOKENA_BORROW_AMOUNT)).to.changeTokenBalances(
				testTokenA,
				[owner, cErc20TokenA],
				[TESTTOKENA_BORROW_AMOUNT, -TESTTOKENA_BORROW_AMOUNT],
			);

			const balance = await testTokenA.balanceOf(owner.address);

			// owner's testTokenA balance === Original - deposit + borrow
			expect(balance).to.equal((100000000n - 100n + 50n) * DECIMAL);
		});

		it('Could repay patial TestTokenA after borrow', async function () {
			const { owner, testTokenA, cErc20TokenA, testTokenB, cErc20TokenB, unitrollerProxy } =
				await loadFixture(setupBorrowRepayFixture);

			// User Setup asset enter market as collateral (by user)
			await unitrollerProxy.enterMarkets([cErc20TokenB.address]);

			// User Setup deposit: testTokenA 100
			const TESTTOKENA_DEPOSIT_AMOUNT = 100n * DECIMAL;
			await testTokenA.approve(cErc20TokenA.address, TESTTOKENA_DEPOSIT_AMOUNT);
			await cErc20TokenA.mint(TESTTOKENA_DEPOSIT_AMOUNT);

			// Mint 1 cErc20TokenB by 1 testTokenB
			const TESTTOKENB_DEPOSIT_AMOUNT = 1n * DECIMAL;
			await testTokenB.approve(cErc20TokenB.address, TESTTOKENB_DEPOSIT_AMOUNT);
			await cErc20TokenB.mint(TESTTOKENB_DEPOSIT_AMOUNT);

			const TESTTOKENA_BORROW_AMOUNT = 50n * DECIMAL;
			await cErc20TokenA.borrow(TESTTOKENA_BORROW_AMOUNT);

			const TESTTOKENA_REPAY_BORROW_AMOUNT = 25n * DECIMAL;

			await testTokenA.approve(cErc20TokenA.address, TESTTOKENA_REPAY_BORROW_AMOUNT);

			// owner's testTokenA decrease, cErc20TokenA's testTokenA increase
			await expect(cErc20TokenA.repayBorrow(TESTTOKENA_REPAY_BORROW_AMOUNT)).to.changeTokenBalances(
				testTokenA,
				[owner, cErc20TokenA],
				[-TESTTOKENA_REPAY_BORROW_AMOUNT, TESTTOKENA_REPAY_BORROW_AMOUNT],
			);

			const balance = await testTokenA.balanceOf(owner.address);

			// owner's testTokenA balance === Original - deposit + borrow - repay
			expect(balance).to.equal((100000000n - 100n + 50n - 25n) * DECIMAL);
		});

		it('Should not withdraw all TestTokenB if has debt', async function () {
			const {
				owner,
				testTokenA,
				cErc20TokenA,
				testTokenB,
				cErc20TokenB,
				cErc20TokenBDelegate,
				unitrollerProxy,
			} = await loadFixture(setupBorrowRepayFixture);

			// User Setup asset enter market as collateral (by user)
			await unitrollerProxy.enterMarkets([cErc20TokenB.address]);

			// User Setup deposit: testTokenA 100
			const TESTTOKENA_DEPOSIT_AMOUNT = 100n * DECIMAL;

			await testTokenA.approve(cErc20TokenA.address, TESTTOKENA_DEPOSIT_AMOUNT);
			await cErc20TokenA.mint(TESTTOKENA_DEPOSIT_AMOUNT);

			// Mint 1 cErc20TokenB by 1 testTokenB
			const TESTTOKENB_DEPOSIT_AMOUNT = 1n * DECIMAL;

			await testTokenB.approve(cErc20TokenB.address, TESTTOKENB_DEPOSIT_AMOUNT);
			await cErc20TokenB.mint(TESTTOKENB_DEPOSIT_AMOUNT);

			const TESTTOKENA_BORROW_AMOUNT = 50n * DECIMAL;
			await cErc20TokenA.borrow(TESTTOKENA_BORROW_AMOUNT);

			await expect(cErc20TokenB.redeem(TESTTOKENB_DEPOSIT_AMOUNT))
				.to.be.revertedWithCustomError(cErc20TokenBDelegate, 'RedeemComptrollerRejection')
				.withArgs(4);
		});

		it('Could repay all TestTokenA after borrow', async function () {
			const { owner, testTokenA, cErc20TokenA, testTokenB, cErc20TokenB, unitrollerProxy } =
				await loadFixture(setupBorrowRepayFixture);

			// User Setup asset enter market as collateral (by user)
			await unitrollerProxy.enterMarkets([cErc20TokenB.address]);

			// User Setup deposit: testTokenA 100
			const TESTTOKENA_DEPOSIT_AMOUNT = 100n * DECIMAL;
			await testTokenA.approve(cErc20TokenA.address, TESTTOKENA_DEPOSIT_AMOUNT);
			await cErc20TokenA.mint(TESTTOKENA_DEPOSIT_AMOUNT);

			// Mint 1 cErc20TokenB by 1 testTokenB
			const TESTTOKENB_DEPOSIT_AMOUNT = 1n * DECIMAL;
			await testTokenB.approve(cErc20TokenB.address, TESTTOKENB_DEPOSIT_AMOUNT);
			await cErc20TokenB.mint(TESTTOKENB_DEPOSIT_AMOUNT);

			const TESTTOKENA_BORROW_AMOUNT = 50n * DECIMAL;
			await cErc20TokenA.borrow(TESTTOKENA_BORROW_AMOUNT);

			await testTokenA.approve(cErc20TokenA.address, TESTTOKENA_BORROW_AMOUNT);

			// owner's testTokenA decrease, cErc20TokenA's testTokenA increase
			await expect(cErc20TokenA.repayBorrow(TESTTOKENA_BORROW_AMOUNT)).to.changeTokenBalances(
				testTokenA,
				[owner, cErc20TokenA],
				[-TESTTOKENA_BORROW_AMOUNT, TESTTOKENA_BORROW_AMOUNT],
			);

			const balance = await testTokenA.balanceOf(owner.address);

			// owner's testTokenA balance === Original - deposit
			expect(balance).to.equal((100000000n - 100n) * DECIMAL);
		});

		it('Chould withdraw all TestTokenB if has no debt', async function () {
			const { owner, testTokenA, cErc20TokenA, testTokenB, cErc20TokenB, unitrollerProxy } =
				await loadFixture(setupBorrowRepayFixture);

			// User Setup asset enter market as collateral (by user)
			await unitrollerProxy.enterMarkets([cErc20TokenB.address]);

			// User Setup deposit: testTokenA 100
			const TESTTOKENA_DEPOSIT_AMOUNT = 100n * DECIMAL;
			await testTokenA.approve(cErc20TokenA.address, TESTTOKENA_DEPOSIT_AMOUNT);
			await cErc20TokenA.mint(TESTTOKENA_DEPOSIT_AMOUNT);

			// Mint 1 cErc20TokenB by 1 testTokenB
			const TESTTOKENB_DEPOSIT_AMOUNT = 1n * DECIMAL;
			await testTokenB.approve(cErc20TokenB.address, TESTTOKENB_DEPOSIT_AMOUNT);
			await cErc20TokenB.mint(TESTTOKENB_DEPOSIT_AMOUNT);

			const TESTTOKENA_BORROW_AMOUNT = 50n * DECIMAL;
			await cErc20TokenA.borrow(TESTTOKENA_BORROW_AMOUNT);

			await testTokenA.approve(cErc20TokenA.address, TESTTOKENA_BORROW_AMOUNT);

			// owner's testTokenA decrease, cErc20TokenA's testTokenA increase
			await cErc20TokenA.repayBorrow(TESTTOKENA_BORROW_AMOUNT);

			// owner's testTokenA decrease, cErc20TokenA's testTokenA increase
			await expect(cErc20TokenB.redeem(TESTTOKENB_DEPOSIT_AMOUNT)).to.changeTokenBalances(
				testTokenB,
				[owner, cErc20TokenB],
				[TESTTOKENB_DEPOSIT_AMOUNT, -TESTTOKENB_DEPOSIT_AMOUNT],
			);
		});
	});

	describe('liquidate', function () {
		async function setupLiquidateFixture() {
			const compound = await deployCompoundWithMultiMarketFixture();

			const {
				priceOracle,
				cErc20TokenA,
				cErc20TokenB,
				unitrollerProxy,
				testTokenA,
				testTokenB,
				otherAccount,
			} = compound;

			const user2 = otherAccount[0];

			// Setup tokenA for user2
			await testTokenA.transfer(user2.address, 1000n * DECIMAL);

			const TESTTOKENA_PRICE = 1n * DECIMAL;
			const TESTTOKENB_PRICE = 100n * DECIMAL;
			const COLLATERAL_FACTOR = new Bignumber(0.5).multipliedBy(DECIMAL.toString());

			// Controller Setup Price: testTokenA = $1, testTokenB = $100
			await priceOracle.setUnderlyingPrice(cErc20TokenA.address, TESTTOKENA_PRICE);
			await priceOracle.setUnderlyingPrice(cErc20TokenB.address, TESTTOKENB_PRICE);

			// Controller Setup Collateral factor: testTokenB 50% = 0.5
			await unitrollerProxy._setCollateralFactor(
				cErc20TokenB.address,
				COLLATERAL_FACTOR.toString(),
			);

			// User Setup asset enter market as collateral (by user)
			await unitrollerProxy.enterMarkets([cErc20TokenB.address]);

			// User Setup deposit: testTokenA 100
			const TESTTOKENA_DEPOSIT_AMOUNT = 100n * DECIMAL;
			await testTokenA.approve(cErc20TokenA.address, TESTTOKENA_DEPOSIT_AMOUNT);
			await cErc20TokenA.mint(TESTTOKENA_DEPOSIT_AMOUNT);

			// Mint 1 cErc20TokenB by 1 testTokenB
			const TESTTOKENB_DEPOSIT_AMOUNT = 1n * DECIMAL;
			await testTokenB.approve(cErc20TokenB.address, TESTTOKENB_DEPOSIT_AMOUNT);
			await cErc20TokenB.mint(TESTTOKENB_DEPOSIT_AMOUNT);

			// User borrow tokenA
			const TESTTOKENA_BORROW_AMOUNT = 50n * DECIMAL;
			await cErc20TokenA.borrow(TESTTOKENA_BORROW_AMOUNT);

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
				COLLATERAL_FACTOR,
				user2,
				CLOSE_FACTOR,
				LIQUIDATION_INCENTIVE,
				TESTTOKENA_PRICE,
				TESTTOKENB_PRICE,
				PROTOCOL_SEIZE_SHARE,
				TESTTOKENA_BORROW_AMOUNT,
			};
		}

		it('Should have shortfall after liquidated ', async function () {
			const { owner, COLLATERAL_FACTOR, cErc20TokenB, unitrollerProxy } = await loadFixture(
				setupLiquidateFixture,
			);

			await unitrollerProxy._setCollateralFactor(
				cErc20TokenB.address,
				COLLATERAL_FACTOR.dividedBy(2).toString(),
			);

			const result = await unitrollerProxy.getAccountLiquidity(owner.address);

			// shortfall > 0
			expect(result[2]).to.gt(0);
		});

		it('Could liquidate user that have shortfall after decrease factor of collateral', async function () {
			const {
				owner,
				user2,
				testTokenA,
				cErc20TokenA,
				COLLATERAL_FACTOR,
				CLOSE_FACTOR,
				cErc20TokenB,
				unitrollerProxy,
				LIQUIDATION_INCENTIVE,
				TESTTOKENA_PRICE,
				TESTTOKENB_PRICE,
				PROTOCOL_SEIZE_SHARE,
				TESTTOKENA_BORROW_AMOUNT,
			} = await loadFixture(setupLiquidateFixture);

			// decrease tokenB collateral factor
			await unitrollerProxy._setCollateralFactor(
				cErc20TokenB.address,
				COLLATERAL_FACTOR.dividedBy(2).toString(),
			);

			// const result = await unitrollerProxy.getAccountLiquidity(owner.address);

			const tokenBExchangeRate = await cErc20TokenB.exchangeRateStored();

			// const shortfall = result[2];

			// Setup calculator
			const liqCalculator = new LiqCalculator(
				CLOSE_FACTOR,
				LIQUIDATION_INCENTIVE,
				PROTOCOL_SEIZE_SHARE,
			);

			liqCalculator.addToken({
				name: 'TokenA',
				price: new Bignumber(TESTTOKENA_PRICE.toString()),
				exchangeRate: new Bignumber(0), // not use
			});

			liqCalculator.addToken({
				name: 'TokenB',
				price: new Bignumber(TESTTOKENB_PRICE.toString()),
				exchangeRate: new Bignumber(tokenBExchangeRate.toString()),
			});

			const repayAmount = liqCalculator.getRepayAmount(
				'TokenA',
				new Bignumber(((TESTTOKENA_BORROW_AMOUNT * TESTTOKENA_PRICE) / DECIMAL).toString()),
			);

			await testTokenA.connect(user2).approve(cErc20TokenA.address, repayAmount.toString());

			const { seizeTokens, liquidatorSeizeTokens } = liqCalculator.getSeize(
				'TokenA',
				'TokenB',
				repayAmount,
			);

			// console.log('calculate', liquidatorSeizeTokens);

			// user2 repay testTokenA, cErc20TokenA's testTokenA increase, user2's testTokenA decrease
			// user2 earn cErc20TokenB, user2's cErc20TokenB increase, owner's cErc20TokenB decrease
			await expect(
				cErc20TokenA
					.connect(user2)
					.liquidateBorrow(owner.address, repayAmount.toString(), cErc20TokenB.address),
			)
				.to.changeTokenBalances(
					testTokenA,
					[cErc20TokenA, user2],
					[repayAmount.toString(), repayAmount.negated().toString()],
				)
				.to.changeTokenBalances(
					cErc20TokenB,
					[user2, owner],
					[liquidatorSeizeTokens.toString(), seizeTokens.negated().toString()],
				);
		});

		it('Could liquidate user that have shortfall after decrease price of collateral', async function () {
			const {
				owner,
				user2,
				testTokenA,
				cErc20TokenA,
				CLOSE_FACTOR,
				cErc20TokenB,
				unitrollerProxy,
				LIQUIDATION_INCENTIVE,
				TESTTOKENA_PRICE,
				TESTTOKENB_PRICE,
				PROTOCOL_SEIZE_SHARE,
				priceOracle,
				TESTTOKENA_BORROW_AMOUNT,
			} = await loadFixture(setupLiquidateFixture);

			// decrease tokenB oracle price
			const NEW_TESTTOKENB_PRICE = TESTTOKENB_PRICE / 2n;
			await priceOracle.setUnderlyingPrice(cErc20TokenB.address, NEW_TESTTOKENB_PRICE);

			// const result = await unitrollerProxy.getAccountLiquidity(owner.address);

			const tokenBExchangeRate = await cErc20TokenB.exchangeRateStored();

			// const shortfall = result[2];

			// Setup calculator
			const liqCalculator = new LiqCalculator(
				CLOSE_FACTOR,
				LIQUIDATION_INCENTIVE,
				PROTOCOL_SEIZE_SHARE,
			);

			liqCalculator.addToken({
				name: 'TokenA',
				price: new Bignumber(TESTTOKENA_PRICE.toString()),
				exchangeRate: new Bignumber(0), // not use
			});

			liqCalculator.addToken({
				name: 'TokenB',
				price: new Bignumber(NEW_TESTTOKENB_PRICE.toString()),
				exchangeRate: new Bignumber(tokenBExchangeRate.toString()),
			});

			const repayAmount = liqCalculator.getRepayAmount(
				'TokenA',
				new Bignumber(((TESTTOKENA_BORROW_AMOUNT * TESTTOKENA_PRICE) / DECIMAL).toString()),
			);

			await testTokenA.connect(user2).approve(cErc20TokenA.address, repayAmount.toString());

			const { seizeTokens, liquidatorSeizeTokens } = liqCalculator.getSeize(
				'TokenA',
				'TokenB',
				repayAmount,
			);

			// console.log('calculate', liquidatorSeizeTokens);

			// user2 repay testTokenA, cErc20TokenA's testTokenA increase, user2's testTokenA decrease
			// user2 earn cErc20TokenB, user2's cErc20TokenB increase, owner's cErc20TokenB decrease
			await expect(
				cErc20TokenA
					.connect(user2)
					.liquidateBorrow(owner.address, repayAmount.toString(), cErc20TokenB.address),
			)
				.to.changeTokenBalances(
					testTokenA,
					[cErc20TokenA, user2],
					[repayAmount.toString(), repayAmount.negated().toString()],
				)
				.to.changeTokenBalances(
					cErc20TokenB,
					[user2, owner],
					[liquidatorSeizeTokens.toString(), seizeTokens.negated().toString()],
				);
		});
	});
});
