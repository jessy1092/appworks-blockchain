import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import BigNumber from 'bignumber.js';
import Web3 from 'web3';
import { Call, TestCall } from '../test-types';

describe('TestCall', function () {
	// We define a fixture to reuse the same setup in every test.
	// We use loadFixture to run this setup once, snapshot that state,
	// and reset Hardhat Network to that snapshot in every test.
	async function deployOneYearLockFixture() {
		// Contracts are deployed using the first signer/account by default
		const [owner, otherAccount] = await ethers.getSigners();

		const TestCall = await ethers.getContractFactory('TestCall');
		const testCall = (await TestCall.deploy()) as TestCall;

		const Call = await ethers.getContractFactory('Call');
		const call = (await Call.deploy()) as Call;

		return { testCall, call, owner, otherAccount };
	}

	describe('callFoo', function () {
		it('Should call by another contract', async function () {
			const { testCall, call, owner } = await loadFixture(deployOneYearLockFixture);

			await call.callFoo(testCall.address, { value: 111 });

			let bytes = await call.data();

			const data = [];

			bytes = Web3.utils.stripHexPrefix(bytes);

			while (bytes.length > 0) {
				data.push(bytes.slice(0, 64));
				bytes = bytes.slice(64);
			}

			expect(data).to.eql([
				'0000000000000000000000000000000000000000000000000000000000000001',
				'00000000000000000000000000000000000000000000000000000000000003e7',
			]);
		});
	});
});
