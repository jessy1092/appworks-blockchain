import Bignumber from 'bignumber.js';

export const DECIMAL = 10n ** 18n;

interface TOKEN {
	name: string;
	price: Bignumber;
	exchangeRate: Bignumber;
}

interface TOKENS {
	[id: string]: TOKEN;
}

export class LiqCalculator {
	// CLOSE_FACTOR,
	// LIQUIDATION_INCENTIVE,
	// TESTTOKENA_PRICE,
	// TESTTOKENB_PRICE,
	// PROTOCOL_SEIZE_SHARE,

	closeFactor: Bignumber = new Bignumber(0);
	liquidationIncentive: Bignumber = new Bignumber(0);
	protocolSeizeShare: Bignumber = new Bignumber(0);
	tokens: TOKENS = {};

	constructor(
		closeFactor: Bignumber,
		liquidationIncentive: Bignumber,
		protocolSeizeShare: Bignumber,
	) {
		this.closeFactor = closeFactor;
		this.liquidationIncentive = liquidationIncentive;
		this.protocolSeizeShare = protocolSeizeShare;
	}

	addToken(token: TOKEN) {
		this.tokens[token.name] = token;
	}

	// repay asset: tokenName
	getRepayAmount(tokenName: string, shortfall: Bignumber) {
		const token = this.tokens[tokenName];

		return shortfall.dividedBy(token.price).multipliedBy(this.closeFactor);
	}

	// repay asset: tokenAName
	// seize asset: tokenBName
	getSeize(tokenAName: string, tokenBName: string, repayAmount: Bignumber) {
		const tokenA = this.tokens[tokenAName];
		const tokenB = this.tokens[tokenBName];

		//  seizeTokens = seizeAmount / exchangeRate
		//  = actualRepayAmount * (liquidationIncentive * priceBorrowed) / (priceCollateral * exchangeRate)

		// const numerator = this.liquidationIncentive.multipliedBy(tokenA.price);
		// const denominator = tokenB.price.multipliedBy(tokenB.exchangeRate);

		// const ratio = numerator.dividedBy(denominator).multipliedBy(DECIMAL.toString()).toFixed(0);

		const seizeAmount = repayAmount
			.multipliedBy(this.liquidationIncentive)
			.multipliedBy(tokenA.price)
			.dividedBy(tokenB.price)
			.dividedBy(DECIMAL.toString());

		// console.log(seizeAmount.toString());

		const seizeTokens = seizeAmount
			.multipliedBy(DECIMAL.toString())
			.dividedBy(tokenB.exchangeRate)
			.decimalPlaces(0, Bignumber.ROUND_FLOOR);

		// console.log(seizeTokens.toString());

		const protocolSeizeTokens = seizeTokens
			.multipliedBy(this.protocolSeizeShare)
			.dividedBy(DECIMAL.toString())
			.decimalPlaces(0, Bignumber.ROUND_FLOOR);

		const liquidatorSeizeTokens = seizeTokens.minus(protocolSeizeTokens);

		return {
			seizeAmount,
			seizeTokens,
			protocolSeizeTokens,
			liquidatorSeizeTokens,
		};
	}
}
