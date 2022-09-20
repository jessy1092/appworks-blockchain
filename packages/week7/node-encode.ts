import Web3 from 'web3';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const runTx = async () => {
	const web3 = new Web3(
		new Web3.providers.HttpProvider(
			`https://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
		),
	);

	web3.eth.defaultChain = 'goerli';

	// const funcEncode = web3.utils.sha3('claim(uint256)')?.substring(0, 10);
	// const parameterEncode = web3.utils.stripHexPrefix(
	// 	web3.utils.padLeft(web3.utils.numberToHex(1), 64),
	// ); // uint256

	const funcEncode = web3.eth.abi.encodeFunctionSignature(
		'AppWorks(bool,uint256[],address,string)',
	);
	const parameterEncode = web3.eth.abi.encodeParameters(
		['bool', 'uint256[]', 'address', 'string'],
		[true, [9, 18], '0x2ff1f4e5d08a822743ec6b342c521a0a421456cb', 'Jacky'],
	);

	// 0xae53a4a5
	// 0000000000000000000000000000000000000000000000000000000000000001 // bool
	// 0000000000000000000000000000000000000000000000000000000000000080 // offset
	// 0000000000000000000000002ff1f4e5d08a822743ec6b342c521a0a421456cb // address
	// 00000000000000000000000000000000000000000000000000000000000000e0 // offset
	// 0000000000000000000000000000000000000000000000000000000000000002 // length
	// 0000000000000000000000000000000000000000000000000000000000000009 // 9
	// 0000000000000000000000000000000000000000000000000000000000000012 // 18
	// 0000000000000000000000000000000000000000000000000000000000000005 // length
	// 4a61636b79000000000000000000000000000000000000000000000000000000 // string

	// For checking
	console.log(funcEncode);
	console.log(parameterEncode);
};

runTx();
