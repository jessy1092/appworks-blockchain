// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

contract SimpleStorage {
	address public owner;

	string public text;

	constructor() {
		owner = msg.sender;
	}

	function setWithMemory(string memory _text) public {
		text = _text;
	}

	function setWithCalldata(string calldata _text) public {
		text = _text;
	}
}
