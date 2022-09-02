// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

contract Basic {
	address public owner;
	mapping(address => uint256) public balances;
	mapping(address => mapping(address => bool)) public isFriend;

	constructor() {
		owner = msg.sender;
	}

	function examples() external {
		balances[msg.sender] = 123;
		uint256 bal = balances[msg.sender];
		uint256 bal2 = balances[address(1)]; // 不存在的 mapping 會是預設值 0

		balances[msg.sender] += 456; // 123 + 456

		delete balances[msg.sender]; // 0

		isFriend[msg.sender][address(this)] = true;
	}
}
