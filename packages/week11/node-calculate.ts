import Bignumber from 'bignumber.js';

import { DECIMAL, LiqCalculator } from './test/compound/utils';

const run = () => {
	const CLOSE_FACTOR = new Bignumber(0.5).multipliedBy(DECIMAL.toString());
	const LIQUIDATION_INCENTIVE = new Bignumber(1.1).multipliedBy(DECIMAL.toString());
	const PROTOCOL_SEIZE_SHARE = new Bignumber(0);

	const liqCalculator = new LiqCalculator(
		CLOSE_FACTOR,
		LIQUIDATION_INCENTIVE,
		PROTOCOL_SEIZE_SHARE,
	);

	const TOKENA_PRICE = 100n * DECIMAL;
	const TOKENB_PRICE = 1n * DECIMAL;

	const exchangeRate = 1n * DECIMAL;
	const TokenBShortfall = 40n * DECIMAL;

	liqCalculator.addToken({
		name: 'TokenA',
		price: new Bignumber(TOKENA_PRICE.toString()),
		exchangeRate: new Bignumber(exchangeRate.toString()), // not use
	});

	liqCalculator.addToken({
		name: 'TokenB',
		price: new Bignumber(TOKENB_PRICE.toString()),
		exchangeRate: new Bignumber(exchangeRate.toString()),
	});

	const repayAmount = liqCalculator.getRepayAmount(
		'TokenB',
		new Bignumber(TokenBShortfall.toString()),
	);

	const { seizeAmount, seizeTokens, liquidatorSeizeTokens } = liqCalculator.getSeize(
		'TokenB',
		'TokenA',
		repayAmount,
	);

	console.log(
		TokenBShortfall.toString(),
		repayAmount.toString(),
		seizeAmount.toString(),
		seizeTokens.toString(),
		liquidatorSeizeTokens.toString(),
	);
};

run();
