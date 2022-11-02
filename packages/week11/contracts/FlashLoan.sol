// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import { IERC20 } from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import { CErc20Delegate } from 'compound-protocol/contracts/CErc20Delegate.sol';

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
	address public immutable override ADDRESSES_PROVIDER;
	address public immutable override LENDING_POOL;

	constructor(address provider, address lendingPool) {
		ADDRESSES_PROVIDER = provider;
		LENDING_POOL = lendingPool;
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
	) external override returns (bool) {
		//
		// This contract now has the funds requested.
		// Your logic goes here.
		//

		(
			address borrower,
			address liquideAddress,
			address rewardAddress,
			address liquideErc20Address,
			address rewardErc20Address
		) = abi.decode(params, (address, address, address, address, address));

		CErc20Delegate liquideCERC20Token = CErc20Delegate(liquideAddress);
		CErc20Delegate rewardCERC20Token = CErc20Delegate(rewardAddress);

		liquideCERC20Token.liquidateBorrow(borrower, amounts[0], rewardCERC20Token);

		uint256 redeemTokens = rewardCERC20Token.balanceOf(address(this));

		// console.log(redeemTokens);

		// redeem reward
		liquideCERC20Token.redeem(redeemTokens);

		IERC20 liquideToken = IERC20(liquideErc20Address);
		IERC20 rewardToken = IERC20(rewardErc20Address);

		uint256 rewardBalances = liquideToken.balanceOf(address(this));

		// console.log(rewardBalances);

		// At the end of your logic above, this contract owes
		// the flashloaned amounts + premiums.
		// Therefore ensure your contract has enough to repay
		// these amounts.

		// Approve the LendingPool contract allowance to *pull* the owed amount
		uint256 amountOwing = amounts[0] + premiums[0];
		IERC20(assets[0]).approve(address(LENDING_POOL), amountOwing);

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
