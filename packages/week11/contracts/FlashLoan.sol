// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import { IERC20 } from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import { CErc20 } from 'compound-protocol/contracts/CErc20.sol';

import { TransferHelper } from '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';
import { ISwapRouter } from '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';

// import 'hardhat/console.sol';

/**
 * @title IFlashLoanReceiver interface
 * @notice Interface for the Aave fee IFlashLoanReceiver.
 * @author Aave
 * @dev implement this interface to develop a flashloan-compatible flashLoanReceiver contract
 **/
interface IFlashLoanReceiver {
	function executeOperation(
		address[] calldata assets,
		uint256[] calldata amounts,
		uint256[] calldata premiums,
		address initiator,
		bytes calldata params
	) external returns (bool);

	function ADDRESSES_PROVIDER() external view returns (address);

	function LENDING_POOL() external view returns (address);
}

contract CompoundFlashLoan is IFlashLoanReceiver {
	event FlashLoanSuccess(uint256 n1, uint256 n2);

	address public immutable override ADDRESSES_PROVIDER;
	address public immutable override LENDING_POOL;

	// For this example, we will set the pool fee to 0.3%.
	uint24 public constant poolFee = 3000;

	ISwapRouter public immutable swapRouter;

	address public admin;

	constructor(
		address provider,
		address lendingPool,
		ISwapRouter _swapRouter
	) {
		ADDRESSES_PROVIDER = provider;
		LENDING_POOL = lendingPool;
		swapRouter = _swapRouter;
		admin = msg.sender;
	}

	function withdraw(IERC20 asset, uint256 amount) external {
		require(msg.sender == admin, 'Only admin can withdraw');

		asset.transfer(admin, amount);
	}

	/**
        This function is called after your contract has received the flash loaned amount
     */
	function executeOperation(
		address[] calldata assets,
		uint256[] calldata amounts,
		uint256[] calldata premiums,
		address initiator,
		bytes calldata params
	) external virtual override returns (bool) {
		//
		// This contract now has the funds requested.
		// Your logic goes here.
		//

		(
			address borrower,
			address liquidateAddress,
			address rewardAddress,
			address rewardErc20Address
		) = abi.decode(params, (address, address, address, address));

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
		ISwapRouter.ExactInputSingleParams memory uniSwapparams = ISwapRouter
			.ExactInputSingleParams({
				tokenIn: rewardErc20Address,
				tokenOut: assets[0],
				fee: poolFee,
				recipient: address(this),
				deadline: block.timestamp,
				amountIn: rewardBalances,
				amountOutMinimum: 0,
				sqrtPriceLimitX96: 0
			});

		// The call to `exactInputSingle` executes the swap.
		uint256 amountOut = swapRouter.exactInputSingle(uniSwapparams);

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

	// function myFlashLoanCall() public {
	// 	address receiverAddress = address(this);

	// 	address[] memory assets = new address[](7);
	// 	assets[0] = address(0xB597cd8D3217ea6477232F9217fa70837ff667Af); // Kovan AAVE

	// 	uint256[] memory amounts = new uint256[](7);
	// 	amounts[0] = 1 ether;

	// 	// 0 = no debt, 1 = stable, 2 = variable
	// 	uint256[] memory modes = new uint256[](7);
	// 	modes[0] = 0;

	// 	address onBehalfOf = address(this);
	// 	bytes memory params = '';
	// 	uint16 referralCode = 0;

	// 	LENDING_POOL.flashLoan(
	// 		receiverAddress,
	// 		assets,
	// 		amounts,
	// 		modes,
	// 		onBehalfOf,
	// 		params,
	// 		referralCode
	// 	);
	// }
}
