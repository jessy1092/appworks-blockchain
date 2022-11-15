// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import { ISimpleSwap } from './interface/ISimpleSwap.sol';
import { ERC20 } from '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract SimpleSwap is ISimpleSwap, ERC20 {
	// Implement core logic here
	address private immutable owner;

	constructor(string memory name, string memory symbol) ERC20(name, symbol) {
		owner = msg.sender;
	}

	/// @notice Swap tokenIn for tokenOut with amountIn
	/// @param tokenIn The address of the token to swap from
	/// @param tokenOut The address of the token to swap to
	/// @param amountIn The amount of tokenIn to swap
	/// @return amountOut The amount of tokenOut received
	function swap(
		address tokenIn,
		address tokenOut,
		uint256 amountIn
	) external returns (uint256 amountOut) {
		return 0;
	}

	/// @notice Add liquidity to the pool
	/// @param amountAIn The amount of tokenA to add
	/// @param amountBIn The amount of tokenB to add
	/// @return amountA The actually amount of tokenA added
	/// @return amountB The actually amount of tokenB added
	/// @return liquidity The amount of liquidity minted
	function addLiquidity(uint256 amountAIn, uint256 amountBIn)
		external
		returns (
			uint256 amountA,
			uint256 amountB,
			uint256 liquidity
		)
	{
		return (0, 0, 0);
	}

	/// @notice Remove liquidity from the pool
	/// @param liquidity The amount of liquidity to remove
	/// @return amountA The amount of tokenA received
	/// @return amountB The amount of tokenB received
	function removeLiquidity(uint256 liquidity)
		external
		returns (uint256 amountA, uint256 amountB)
	{
		return (0, 0);
	}

	/// @notice Get the reserves of the pool
	/// @return reserveA The reserve of tokenA
	/// @return reserveB The reserve of tokenB
	function getReserves() external view returns (uint256 reserveA, uint256 reserveB) {
		return (0, 0);
	}

	/// @notice Get the address of tokenA
	/// @return tokenA The address of tokenA
	function getTokenA() external view returns (address tokenA) {
		return msg.sender;
	}

	/// @notice Get the address of tokenB
	/// @return tokenB The address of tokenB
	function getTokenB() external view returns (address tokenB) {
		return msg.sender;
	}
}
