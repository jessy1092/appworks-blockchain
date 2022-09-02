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
		Car[] storage ownersCar = carsByOwner[msg.sender]; // 會改變 carsByOwner 裡面的值，因此宣告為 storage

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

	function addCarByOwnerIndex(
		uint256 i,
		string calldata model,
		uint256 year
	) external {
		Car[] storage ownersCar = carsByOwner[msg.sender]; // 會改變 carsByOwner 裡面的值，因此宣告為 storage

		add(ownersCar, model, year, i);
	}

	function add(
		Car[] storage cars,
		string calldata model, // 避免 copy。節省 gas
		uint256 year,
		uint256 index
	) private {
		require(index <= cars.length, 'index out of bound');

		Car memory lastCar = cars[cars.length - 1];
		cars.push(lastCar);

		for (uint256 i = cars.length - 1; i > index; i--) {
			cars[i] = cars[i - 1];
		}

		cars[index] = Car(model, year);
	}

	function getCarByOwnerIndex(uint256 i) external view returns (Car memory) {
		Car[] memory ownersCar = carsByOwner[msg.sender]; // 不會改變 carsByOwner 裡面的值，因此宣告為 memory

		require(ownersCar.length > 0, 'Owner should have car');
		require(ownersCar.length > i, 'index out of bound');

		return ownersCar[i];
	}
}
