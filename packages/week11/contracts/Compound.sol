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

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

// Make TestToken inherit from the ERC20 contract
contract TestToken is ERC20 {
	constructor() ERC20('TestToken', 'TT') {
		uint256 n = 100000000;
		_mint(msg.sender, n * 10**uint256(decimals()));
	}

	function mint(address account) public virtual {
		uint256 n = 10000;
		_mint(account, n * 10**uint256(decimals()));
	}
}

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
