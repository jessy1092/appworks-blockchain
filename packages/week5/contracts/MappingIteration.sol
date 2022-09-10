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

	// 可以指定插入陣列的位置，使用 replace
	function _insertKey(uint256 _i, address _key) internal {
		require(keys.length >= _i, 'index out of bound');

		address replaceKey = keys[_i]; // 要插入位置的 key
		uint256 keyOfIndex = insertedIndex[_key];

		// key 已存在，跟要插入的位置交換
		if (keyOfIndex > 0) {
			keys[keyOfIndex - 1] = replaceKey;
			insertedIndex[replaceKey] = keyOfIndex;
		} else {
			// key 不存在，插入的位置移至最後一位
			keys.push(replaceKey);
			insertedIndex[replaceKey] = keys.length;
		}

		keys[_i] = _key;
		insertedIndex[_key] = _i + 1;
	}

	// 可以刪除指定 index 的 key，使用 replace
	function _removeKey(uint256 _i) internal {
		require(keys.length > _i, 'index out of bound');

		address removeKey = keys[_i];

		keys[_i] = keys[keys.length - 1];

		keys.pop();
		delete insertedIndex[removeKey]; // reset to zero
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
			delete balances[_key];
		}
	}

	function add(
		address _key,
		uint256 _val,
		uint256 _i
	) external {
		balances[_key] = _val;

		_insertKey(_i, _key);
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

	function getKeyIndex(address _key) external view returns (uint256) {
		require(insertedIndex[_key] > 0, 'index out of bound');
		return insertedIndex[_key] - 1;
	}

	function getKey(uint256 _i) external view returns (address) {
		require(keys.length > _i, 'index out of bound');
		return keys[_i];
	}
}
