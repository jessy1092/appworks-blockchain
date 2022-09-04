// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

contract Counter {
	address public owner;

	uint256 public count = 0;

	constructor() {
		owner = msg.sender;
	}

	function increase() external {
		require(msg.sender == owner, 'Only owner');
		count++;
	}

	function decrease() external {
		require(msg.sender == owner, 'Only owner');
		count--;
	}
}
