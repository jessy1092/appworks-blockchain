// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

contract ReentrancyGuard {
	enum Status {
		ENTERED,
		NOT_ENTERED
	}

	Status private _state;

	constructor() {
		_state = Status.NOT_ENTERED;
	}

	modifier nonReentrant() {
		require(_state == Status.NOT_ENTERED, 'Reentrant Call');
		_state = Status.ENTERED;
		_;
		_state = Status.NOT_ENTERED;
	}
}
