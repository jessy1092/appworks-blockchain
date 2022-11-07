import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';

export const createMerkleTree = (addresses: string[]): MerkleTree => {
	let leaves = addresses.map(addr => keccak256(addr));
	let merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });

	// let rootHash = merkleTree.getRoot().toString('hex');
	// console.log(merkleTree.toString());
	// console.log(rootHash);

	return merkleTree;
};
