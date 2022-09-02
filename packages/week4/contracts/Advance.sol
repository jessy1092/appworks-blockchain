// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

contract Advance {
	address public owner;

	struct Car {
		string model;
		uint256 year;
	}

	Car[] public totalCars;
	mapping(address => Car[]) public carsByOwner;

	address[] public owners;

	constructor() {
		owner = msg.sender;
	}

	function examples() external {
		Car memory toyota = Car('Toyota', 2020);
		Car memory tesla = Car('Tesla', 2021);

		totalCars.push(toyota);
		totalCars.push(tesla);

		// 給特定 owner
		carsByOwner[msg.sender].push(toyota);
		carsByOwner[msg.sender].push(tesla);
	}

	function removeCarByOwner(uint256 i) external {
		Car[] storage ownersCar = carsByOwner[msg.sender];

		require(ownersCar.length > 0, 'Owner should have car');

		// 直接設置為零
		delete ownersCar[i];

		remove(ownersCar, i);
	}

	function remove(Car[] storage cars, uint256 index) private {
		require(index < cars.length, 'index out of bound');

		for (uint256 i = index; i < cars.length - 1; i++) {
			cars[i] = cars[i + 1];
		}
		cars.pop();
	}

	function getCarByOwnerIndex(uint256 i) external view returns (Car memory) {
		Car[] memory ownersCar = carsByOwner[msg.sender];

		require(ownersCar.length > 0, 'Owner should have car');
		require(ownersCar.length > i, 'index out of bound');

		return ownersCar[i];
	}
}
