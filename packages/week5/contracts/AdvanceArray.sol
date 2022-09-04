// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

contract AdvanceArray {
	address public owner;

	address[] public tokens;

	constructor() {
		owner = msg.sender;
	}

	function push(address _addr) external {
		tokens.push(_addr);
	}

	function removeWithShift(uint256 _i) external {
		require(tokens.length > _i, 'index out of bound');

		for (uint256 index = _i; index < tokens.length - 1; index++) {
			tokens[index] = tokens[index + 1];
		}
		tokens.pop();
	}

	function removeWithReplace(uint256 _i) external {
		require(tokens.length > _i, 'index out of bound');

		tokens[_i] = tokens[tokens.length - 1];
		tokens.pop();
	}
}
