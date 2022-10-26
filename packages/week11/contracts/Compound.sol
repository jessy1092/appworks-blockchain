// contracts/TWDF.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

// Import CErc20
import 'compound-protocol/contracts/CErc20Delegator.sol';
import 'compound-protocol/contracts/CErc20Delegate.sol';
import 'compound-protocol/contracts/Comptroller.sol';
import 'compound-protocol/contracts/Unitroller.sol';
import 'compound-protocol/contracts/InterestRateModel.sol';
import 'compound-protocol/contracts/SimplePriceOracle.sol';

contract ZeroInterestRateModel is InterestRateModel {
	function getBorrowRate(
		uint256,
		uint256,
		uint256
	) external pure override returns (uint256) {
		return 0;
	}

	function getSupplyRate(
		uint256,
		uint256,
		uint256,
		uint256
	) public pure override returns (uint256) {
		return 0;
	}
}
