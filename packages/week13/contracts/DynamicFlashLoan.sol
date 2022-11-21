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

		require(initiator == admin, 'Should be admin execute');
		require(msg.sender == LENDING_POOL, 'Should be call by LENDING_POOL');

		(
			address borrower,
			address liquidateAddress,
			address rewardAddress,
			address rewardErc20Address,
			bytes memory path
		) = abi.decode(params, (address, address, address, address, bytes));

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
		ISwapRouter.ExactInputParams memory uniSwapparams = ISwapRouter.ExactInputParams({
			path: path,
			recipient: address(this),
			deadline: block.timestamp,
			amountIn: rewardBalances,
			amountOutMinimum: 0
		});

		// The call to `exactInputSingle` executes the swap.
		uint256 amountOut = swapRouter.exactInput(uniSwapparams);

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
