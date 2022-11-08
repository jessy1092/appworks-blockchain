// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import '@app-block/week11/contracts/Compound.sol';
import '@app-block/week11/contracts/FlashLoan.sol';

contract DynamicFlashLoan is CompoundFlashLoan {
	constructor(
		address provider,
		address lendingPool,
		ISwapRouter _swapRouter
	) CompoundFlashLoan(provider, lendingPool, _swapRouter) {}

	/**
        This function is called after your contract has received the flash loaned amount
     */
	function executeOperation(
		address[] calldata assets,
		uint256[] calldata amounts,
		uint256[] calldata premiums,
		address initiator,
		bytes calldata params
	) external override returns (bool) {
		//
		// This contract now has the funds requested.
		// Your logic goes here.
		//

		(
			address borrower,
			address liquidateAddress,
			address rewardAddress,
			address[] memory routes
		) = abi.decode(params, (address, address, address, address[]));

		address rewardErc20Address = routes[0];

		IERC20(assets[0]).approve(liquidateAddress, amounts[0]);

		// Liquidate the borrower debt
		CErc20(liquidateAddress).liquidateBorrow(borrower, amounts[0], CErc20(rewardAddress));

		uint256 redeemTokens = IERC20(rewardAddress).balanceOf(address(this));

		// redeem reward
		CErc20(rewardAddress).redeem(redeemTokens);

		uint256 rewardBalances = IERC20(rewardErc20Address).balanceOf(address(this));

		// emit LOG(rewardBalances, redeemTokens);

		// Approve the router to spend DAI.
		TransferHelper.safeApprove(rewardErc20Address, address(swapRouter), rewardBalances);

		// Naively set amountOutMinimum to 0. In production, use an oracle or other data source to choose a safer value for amountOutMinimum.
		// We also set the sqrtPriceLimitx96 to be 0 to ensure we swap our exact input amount.

		uint256 amountIn = rewardBalances;
		uint256 amountOut = rewardBalances;

		for (uint256 i; i < routes.length - 1; i++) {
			amountIn = amountOut;

			ISwapRouter.ExactInputSingleParams memory uniSwapparams = ISwapRouter
				.ExactInputSingleParams({
					tokenIn: routes[i],
					tokenOut: assets[i + 1],
					fee: poolFee,
					recipient: address(this),
					deadline: block.timestamp,
					amountIn: amountIn,
					amountOutMinimum: 0,
					sqrtPriceLimitX96: 0
				});

			// The call to `exactInputSingle` executes the swap.
			amountOut = swapRouter.exactInputSingle(uniSwapparams);
		}

		// console.log(rewardBalances);
		//
		// At the end of your logic above, this contract owes
		// the flashloaned amounts + premiums.
		// Therefore ensure your contract has enough to repay
		// these amounts.
		uint256 amountOwing = amounts[0] + premiums[0];

		if (amountOut > amountOwing) {
			// Approve the LendingPool contract allowance to *pull* the owed amount
			IERC20(assets[0]).approve(address(LENDING_POOL), amountOwing);
			emit FlashLoanSuccess(amountOut, amountOwing);
		}

		return true;
	}
}
