// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

contract TodoList {
	address public owner;
	uint256 todoId;

	struct Todo {
		uint256 _id;
		uint256 _iid;
		address owner;
		string text;
		bool completed;
	}
	mapping(uint256 => Todo) public TodoMap;

	struct Todos {
		string name;
		uint256[] list;
	}
	mapping(address => Todos) public todosByOwner;

	constructor() {
		owner = msg.sender;
	}

	function create(string calldata _text) external {
		Todos storage myTodos = todosByOwner[msg.sender];
		TodoMap[todoId] = Todo(todoId, myTodos.list.length, msg.sender, _text, false);
		myTodos.list.push(todoId);

		// Update global index;
		todoId++;
	}

	function updateText(uint256 _id, string calldata _text) external {
		require(TodoMap[_id].owner == msg.sender, 'Should be the owner');
		TodoMap[_id].text = _text;
	}

	function toggleCompleted(uint256 _id) external {
		require(TodoMap[_id].owner == msg.sender, 'Should be the owner');
		TodoMap[_id].completed = !TodoMap[_id].completed;
	}

	function remove(uint256 _id) external {
		require(TodoMap[_id].owner == msg.sender, 'Should be the owner');
		uint256 replaceId = _removeWithReplace(todosByOwner[msg.sender].list, TodoMap[_id]._iid);
		// Update replace item index
		TodoMap[replaceId]._iid = TodoMap[_id]._iid;

		delete TodoMap[_id];
	}

	function transfer(uint256 _id, address _to) external {
		Todo storage transferTodo = TodoMap[_id];
		require(transferTodo.owner == msg.sender, 'Should be the owner');
		uint256 replaceId = _removeWithReplace(todosByOwner[msg.sender].list, transferTodo._iid);
		// Update replace item index
		TodoMap[replaceId]._iid = transferTodo._iid;

		// transfer
		Todos storage targetTodos = todosByOwner[_to];
		transferTodo.owner = _to;
		transferTodo._iid = targetTodos.list.length;
		targetTodos.list.push(_id);
	}

	function setName(string calldata _name) external {
		todosByOwner[msg.sender].name = _name;
	}

	function getTodoList() external view returns (uint256[] memory) {
		return todosByOwner[msg.sender].list;
	}

	function get(uint256 _id) external view returns (string memory, bool) {
		Todo memory todo = TodoMap[_id];

		return (todo.text, todo.completed);
	}

	function _removeWithReplace(uint256[] storage array, uint256 _i) private returns (uint256) {
		require(array.length > _i, 'index out of bound');

		array[_i] = array[array.length - 1];
		array.pop();

		return array[_i];
	}
}
