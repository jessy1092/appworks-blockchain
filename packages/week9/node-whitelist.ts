import keccak256 from 'keccak256';
import { writeFile } from 'node:fs/promises';

import { createMerkleTree } from './utils';

import whitelist from './whitelist.json';

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
