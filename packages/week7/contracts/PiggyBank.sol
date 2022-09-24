// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

contract PiggyBank {
	event Deposit(uint256 amount);
	event Withdraw(uint256 amount);

	address payable public owner;

	modifier onlyOwner() {
		require(msg.sender == owner, 'caller is not owner');
		_;
	}

	constructor() payable {
		owner = payable(msg.sender);
	}

	receive() external payable {
		emit Deposit(msg.value);
	}

	function withdraw() external onlyOwner {
		emit Withdraw(address(this).balance);
		selfdestruct(owner);
	}

	function deposit() external payable {
		require(msg.value > 0, 'value should > 0');
		emit Deposit(msg.value);
	}
}
