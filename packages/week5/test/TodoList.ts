import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';

describe('TodoList', function () {
	// We define a fixture to reuse the same setup in every test.
	// We use loadFixture to run this setup once, snapshot that state,
	// and reset Hardhat Network to that snapshot in every test.
	async function deployOneYearLockFixture() {
		// Contracts are deployed using the first signer/account by default
		const [owner, otherAccount] = await ethers.getSigners();

		const TodoList = await ethers.getContractFactory('TodoList');
		const todoList = await TodoList.deploy();

		return { todoList, owner, otherAccount };
	}

	describe('Deployment', function () {
		it('Should set the right owner', async function () {
			const { todoList, owner } = await loadFixture(deployOneYearLockFixture);

			expect(await todoList.owner()).to.equal(owner.address);
		});

		it('Should receive and store the funds to lock', async function () {
			const { todoList } = await loadFixture(deployOneYearLockFixture);

			expect(await ethers.provider.getBalance(todoList.address)).to.equal(0);
		});
	});

	describe('Create', function () {
		it('Should add a new todo', async function () {
			const { todoList } = await loadFixture(deployOneYearLockFixture);

			await todoList.create('123');

			const [text, completed] = await todoList.get(0);
			const myTodoList = await todoList.getTodoList();

			expect(text).to.equal('123');
			expect(completed).to.equal(false);
			expect(myTodoList).to.eql([BigNumber.from(0)]);
		});

		it('Should add a new todo by difference address', async function () {
			const { todoList, otherAccount } = await loadFixture(deployOneYearLockFixture);

			await todoList.create('123');

			const myTodo = await todoList.get(0);
			const myTodoList = await todoList.getTodoList();

			await todoList.connect(otherAccount).create('321');

			const otherTodo = await todoList.get(1);
			const otherTodoList = await todoList.connect(otherAccount).getTodoList();

			expect(myTodo[0]).to.equal('123');
			expect(myTodo[1]).to.equal(false);
			expect(myTodoList).to.eql([BigNumber.from(0)]);

			expect(otherTodo[0]).to.equal('321');
			expect(otherTodo[1]).to.equal(false);
			expect(otherTodoList).to.eql([BigNumber.from(1)]);
		});
	});

	describe('Update Text', function () {
		it('Should update by owner', async function () {
			const { todoList } = await loadFixture(deployOneYearLockFixture);

			await todoList.create('123');

			await todoList.updateText(0, '321');
			const [text, completed] = await todoList.get(0);

			expect(text).to.equal('321');
			expect(completed).to.equal(false);
		});
	});

	describe('Toggle Completed', function () {
		it('Should toggle by owner', async function () {
			const { todoList } = await loadFixture(deployOneYearLockFixture);

			await todoList.create('123');

			await todoList.toggleCompleted(0);
			const [text, completed] = await todoList.get(0);

			expect(completed).to.equal(true);
		});
	});

	describe('Remove', function () {
		it('Should remove by owner', async function () {
			const { todoList } = await loadFixture(deployOneYearLockFixture);

			await todoList.create('123');
			await todoList.create('321');
			await todoList.remove(0);

			const [text, completed] = await todoList.get(0);
			const myTodoList = await todoList.getTodoList();

			expect(text).to.equal('');
			expect(completed).to.equal(false);
			expect(myTodoList).to.eql([BigNumber.from(1)]);
		});
	});

	describe('Transfer', function () {
		it('Should transfer by owner', async function () {
			const { todoList, otherAccount } = await loadFixture(deployOneYearLockFixture);

			await todoList.create('123');
			await todoList.create('321');
			await todoList.create('456');
			await todoList.transfer(1, otherAccount.address);

			const myTodo = await todoList.TodoMap(2);
			const myTodoList = await todoList.getTodoList();

			const otherTodo = await todoList.TodoMap(1);
			const otherTodoList = await todoList.connect(otherAccount).getTodoList();

			expect(myTodo._iid).to.equal(1); // 456 成為 index 1
			expect(myTodoList).to.eql([BigNumber.from(0), BigNumber.from(2)]);

			expect(otherTodo._iid).to.equal(0); // 321 成為 index 0
			expect(otherTodo.owner).to.equal(otherAccount.address); // 321 成為 otherAccount
			expect(otherTodoList).to.eql([BigNumber.from(1)]);
		});
	});
});
