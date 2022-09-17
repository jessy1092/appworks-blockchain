// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

contract Parent {
	uint8 public age;

	constructor(uint8 _age) {
		age = _age;
	}

	function getAge() public view virtual returns (uint8) {
		return age;
	}
}

contract Parent2 {
	string public name;

	constructor(string memory _name) {
		name = _name;
	}

	function getName() public view virtual returns (string memory) {
		return name;
	}
}

// Static Constructor Input
contract Children is Parent(20), Parent2('Lee') {

}

// Dynamic Constructor Input
contract Children2 is Parent, Parent2 {
	constructor(uint8 _age, string memory _name) Parent(_age) Parent2(_name) {}
}

contract CallParentFunc is Parent, Parent2 {
	constructor(uint8 _age, string memory _name) Parent(_age) Parent2(_name) {}

	function getResult() public view returns (uint8, string memory) {
		return (super.getAge(), super.getName()); // Call use parent function
	}
}

contract CallParentFuncWithOverride is Parent, Parent2 {
	constructor(uint8 _age, string memory _name) Parent(_age) Parent2(_name) {}

	function getAge() public view override returns (uint8) {
		return super.getAge() - 5;
	}

	function getName() public view override returns (string memory) {
		return string.concat('prefix', super.getName());
	}

	function getResult() public view returns (uint8, string memory) {
		return (this.getAge(), this.getName());
	}
}

/* 實驗繼承多種 parent
    A
   / \
  B   C
   \ /
   D,E
*/
contract A {
	function foo() public pure virtual returns (uint256) {
		return 1;
	}
}

contract B is A {
	// Override A.foo()
	function foo() public pure virtual override returns (uint256) {
		return 2;
	}
}

contract C is A {
	// Override A.foo()
	function foo() public pure virtual override returns (uint256) {
		return 3;
	}
}

// 優先從 right 至 left, depth first
contract D is B, C {
	// D.foo() returns 3
	function foo() public pure override(B, C) returns (uint256) {
		return super.foo();
	}
}

// 優先從 right 至 left, depth first
contract E is C, B {
	// E.foo() returns 2
	function foo() public pure override(C, B) returns (uint256) {
		return super.foo();
	}
}
