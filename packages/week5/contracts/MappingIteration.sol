// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

contract MappingIteraction {
	address public owner;

	mapping(address => uint256) public balances;

	// 紀錄 address 在 array 的 index
	// - 0 代表還沒有
	// - 大於 1 代表有存，真正位置在 value - 1
	mapping(address => uint256) public insertedIndex;

	address[] public keys;

	constructor() {
		owner = msg.sender;
	}

	// 可以指定插入陣列的位置
	function _insertKey(uint256 _i, address _key) internal {
		require(keys.length >= _i, 'index out of bound');

		address lastKey = keys[keys.length - 1];
		keys.push(lastKey);

		for (uint256 i = keys.length - 1; i > _i; i--) {
			keys[i] = keys[i - 1];
		}

		keys[_i] = _key;
	}

	// 可以刪除指定的 key
	function _removeKey(uint256 _i) internal {
		require(keys.length > _i, 'index out of bound');

		for (uint256 i = _i; i < keys.length - 1; i++) {
			keys[i] = keys[i + 1];
		}
		keys.pop();
	}

	function set(address _key, uint256 _val) external {
		balances[_key] = _val;

		if (insertedIndex[_key] == 0) {
			keys.push(_key);
			insertedIndex[_key] = keys.length;
		}
	}

	function del(address _key) external {
		uint256 keyIndex = insertedIndex[_key];
		if (keyIndex > 0) {
			_removeKey(keyIndex - 1);
			delete insertedIndex[_key];
			delete balances[_key];
		}
	}

	function add(
		address _key,
		uint256 _val,
		uint256 _i
	) external {
		balances[_key] = _val;

		if (insertedIndex[_key] == 0) {
			_insertKey(_i, _key);
			insertedIndex[_key] = _i + 1;
		}
	}

	function getSize() external view returns (uint256) {
		return keys.length;
	}

	function first() external view returns (uint256) {
		return balances[keys[0]];
	}

	function last() external view returns (uint256) {
		return balances[keys[keys.length - 1]];
	}

	function get(uint256 _i) external view returns (uint256) {
		require(keys.length > _i, 'index out of bound');
		return balances[keys[_i]];
	}
}
