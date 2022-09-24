// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

contract EtherWallet {
	address payable public owner;

	modifier onlyOwner() {
		require(msg.sender == owner, 'caller is not owner');
		_;
	}

	constructor() payable {
		owner = payable(msg.sender);
	}

	receive() external payable {}

	function withdraw(uint256 _amount) external onlyOwner {
		payable(msg.sender).transfer(_amount);
	}

	function deposit() external payable {
		require(msg.value > 0, 'value should > 0');
	}

	function getBalance() external view returns (uint256) {
		return address(this).balance;
	}
}
