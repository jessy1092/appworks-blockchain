// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import { ISimpleSwap } from './interface/ISimpleSwap.sol';
import { ERC20 } from '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import { Math } from '@openzeppelin/contracts/utils/math/Math.sol';

// From https://github.com/AppWorks-School/Blockchain-Resource/tree/main/section3/SimpleSwap

contract SimpleSwap is ISimpleSwap, ERC20 {
	// Implement core logic here

	address private immutable owner;
	ERC20 public tokenA;
	ERC20 public tokenB;
	uint256 public lastK;

	uint256 public reserveA;
	uint256 public reserveB;

	constructor(address _tokenA, address _tokenB) ERC20('Simple Swap Token', 'SToken') {
		owner = msg.sender;
		require(_isContract(address(_tokenA)), 'SimpleSwap: TOKENA_IS_NOT_CONTRACT');
		require(_isContract(address(_tokenB)), 'SimpleSwap: TOKENB_IS_NOT_CONTRACT');
		require(_tokenA != _tokenB, 'SimpleSwap: TOKENA_TOKENB_IDENTICAL_ADDRESS');
		tokenA = ERC20(_tokenA);
		tokenB = ERC20(_tokenB);
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
		require(amountAIn > 0 && amountBIn > 0, 'SimpleSwap: INSUFFICIENT_INPUT_AMOUNT');

		tokenA.transferFrom(msg.sender, address(this), amountAIn);
		tokenB.transferFrom(msg.sender, address(this), amountBIn);

		uint256 _totalSupply = totalSupply();

		if (_totalSupply == 0) {
			liquidity = Math.sqrt(amountAIn * amountBIn);

			_mint(msg.sender, liquidity);

			emit AddLiquidity(msg.sender, amountAIn, amountBIn, liquidity);
		} else {
			liquidity = Math.min(
				(amountAIn / reserveA) * _totalSupply,
				(amountBIn / reserveB) * _totalSupply
			);

			_mint(msg.sender, liquidity);

			emit AddLiquidity(msg.sender, amountAIn, amountBIn, liquidity);
		}
		reserveA = tokenA.balanceOf(address(this));
		reserveB = tokenB.balanceOf(address(this));

		return (reserveA, reserveB, liquidity);
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
	function getReserves() external view returns (uint256, uint256) {
		return (reserveA, reserveB);
	}

	/// @notice Get the address of tokenA
	/// @return tokenA The address of tokenA
	function getTokenA() external view returns (address) {
		return address(tokenA);
	}

	/// @notice Get the address of tokenB
	/// @return tokenB The address of tokenB
	function getTokenB() external view returns (address) {
		return address(tokenB);
	}
}
