// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

contract FuncType {
	address payable public owner;
	int256 public modifyint;

	constructor() {
		owner = payable(msg.sender);
	}

	event Log(string s);

	function funcExternal() external {
		modifyint += 1;
		emit Log('call external');
	}

	function funcInternal() internal {
		modifyint += 2;
		emit Log('call internal');
	}

	function funcPrivate() private {
		modifyint += 3;
		emit Log('call private');
	}

	function funcView() external view returns (int256) {
		// emit Log('call view'); // would be error

		return modifyint;
	}

	function funcPublic() public {
		modifyint += 4;
		emit Log('call public');
	}

	function funcPure() public pure returns (bytes memory) {
		return msg.data;
	}
}
