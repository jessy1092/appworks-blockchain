// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

contract TransferEther {
	address public owner;

	constructor() payable {
		owner = msg.sender;
	}

	receive() external payable {}

	fallback() external payable {}

	function transferWithTransfer(address payable to, uint256 amount) external payable {
		require(address(this).balance > amount, 'balance should > amount');
		require(msg.sender == owner, 'Olny owner :)');

		to.transfer(amount);
	}

	function transferWithSend(address payable to, uint256 amount) external payable {
		require(address(this).balance > amount, 'balance should > amount');
		require(msg.sender == owner, 'Olny owner :)');

		bool success = to.send(amount);

		require(success, 'Send failed');
	}

	function transferWithCall(address payable to, uint256 amount) external payable {
		require(address(this).balance > amount, 'balance should > amount');
		require(msg.sender == owner, 'Olny owner :)');

		(bool success, ) = to.call{ value: amount, gas: 2300 }('');

		require(success, 'Call failed');
	}
}

contract EtherReceiver {
	address public owner;

	constructor() payable {
		owner = msg.sender;
	}

	event Response(uint256 amount);

	receive() external payable {
		emit Response(msg.value);
	}

	fallback() external payable {
		emit Response(msg.value);
	}
}
