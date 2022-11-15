// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import { ISimpleSwap } from './interface/ISimpleSwap.sol';
import { ERC20 } from '@openzeppelin/contracts/token/ERC20/ERC20.sol';

// From https://github.com/AppWorks-School/Blockchain-Resource/tree/main/section3/SimpleSwap

contract SimpleSwap is ISimpleSwap, ERC20 {
	// Implement core logic here
	address private immutable owner;
	address public tokenA;
	address public tokenB;

	constructor(address _tokenA, address _tokenB) ERC20('Simple Swap Token', 'SToken') {
		owner = msg.sender;
		require(_isContract(_tokenA), 'SimpleSwap: TOKENA_IS_NOT_CONTRACT');
		require(_isContract(_tokenB), 'SimpleSwap: TOKENB_IS_NOT_CONTRACT');
		require(_tokenA != _tokenB, 'SimpleSwap: TOKENA_TOKENB_IDENTICAL_ADDRESS');
		tokenA = _tokenA;
		tokenB = _tokenB;
	}

	function _isContract(address addr) private view returns (bool) {
		return addr.code.length > 0;
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
	function getTokenA() external view returns (address) {
		return tokenA;
	}

	/// @notice Get the address of tokenB
	/// @return tokenB The address of tokenB
	function getTokenB() external view returns (address) {
		return tokenB;
	}
}
