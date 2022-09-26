// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

contract ABI {
	address payable public owner;

	struct Person {
		string name;
		uint8 age;
	}

	constructor() {
		owner = payable(msg.sender);
	}

	function encode(
		uint256 x,
		address addr,
		uint256[] calldata arr,
		Person calldata person
	) external pure returns (bytes memory) {
		return abi.encode(x, addr, arr, person);
	}

	function decode(bytes memory data)
		external
		pure
		returns (
			uint256,
			address,
			uint256[] memory,
			Person memory
		)
	{
		(uint256 x, address addr, uint256[] memory arr, Person memory person) = abi.decode(
			data,
			(uint256, address, uint256[], Person)
		);

		return (x, addr, arr, person);
	}
}
