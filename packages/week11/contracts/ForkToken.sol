// contracts/TWDF.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

// Import ERC20 from the OpenZeppelin Contracts library
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

// Make TWDF inherit from the ERC20 contract
contract ForkToken is ERC20 {
	constructor() ERC20('Fake TWD', 'TWDF') {}
}
