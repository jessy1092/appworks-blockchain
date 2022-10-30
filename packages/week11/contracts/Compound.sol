// contracts/TWDF.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

// Import CErc20 and Comptroller
import { CErc20Delegator } from 'compound-protocol/contracts/CErc20Delegator.sol';
import { CErc20Delegate } from 'compound-protocol/contracts/CErc20Delegate.sol';
import { Comptroller } from 'compound-protocol/contracts/Comptroller.sol';
import { Unitroller } from 'compound-protocol/contracts/Unitroller.sol';
import { InterestRateModel } from 'compound-protocol/contracts/InterestRateModel.sol';
import { SimplePriceOracle } from 'compound-protocol/contracts/SimplePriceOracle.sol';

// Import Governor Bravo
import { GovernorAlpha } from 'compound-protocol/contracts/Governance/GovernorAlpha.sol';
import {
	GovernorBravoDelegator
} from 'compound-protocol/contracts/Governance/GovernorBravoDelegator.sol';
import {
	GovernorBravoDelegate
} from 'compound-protocol/contracts/Governance/GovernorBravoDelegate.sol';
import {
	GovernorAlpha as IGovernorAlpha
} from 'compound-protocol/contracts/Governance/GovernorBravoInterfaces.sol';
import { Comp } from 'compound-protocol/contracts/Governance/Comp.sol';
import { Timelock } from 'compound-protocol/contracts/Timelock.sol';

import { ERC20 } from '@openzeppelin/contracts/token/ERC20/ERC20.sol';

// Make TestToken inherit from the ERC20 contract
contract TestToken is ERC20 {
	constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {
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

contract GovernorAlphaZero is IGovernorAlpha {
	function proposalCount() external pure override returns (uint256) {
		return 1;
	}
}
