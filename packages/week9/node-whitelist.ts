import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';
import { writeFile } from 'node:fs/promises';

import whitelist from './whitelist.json';

export const createMerkleTree = (addresses: string[]): MerkleTree => {
	let leaves = addresses.map(addr => keccak256(addr));
	let merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });

	// let rootHash = merkleTree.getRoot().toString('hex');
	// console.log(merkleTree.toString());
	// console.log(rootHash);

	return merkleTree;
};

interface MerkleData {
	[id: string]: string | string[];
}

const run = async () => {
	const merkleTree = createMerkleTree(whitelist);

	const data: MerkleData = {
		merkleRoot: `0x${merkleTree.getRoot().toString('hex')}`,
	};

	whitelist.forEach(address => {
		data[address] = merkleTree.getHexProof(keccak256(address));
	});

	await writeFile('whitelist-merkleTree.json', JSON.stringify(data));
};

run();
