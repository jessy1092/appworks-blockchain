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

	// const funcEncode = web3.eth.abi.encodeFunctionSignature('proposeNewAdmin(address)');
	// const parameterEncode = web3.eth.abi.encodeParameters(
	// 	['address'],
	// 	[''],
	// );

	const funcEncode = web3.eth.abi.encodeFunctionSignature('deposit()');
	const parameterEncode = web3.eth.abi.encodeParameters(['bytes[]'], [['0xd0e30db0']]);

	const funcEncode1 = web3.eth.abi.encodeFunctionSignature('multicall(bytes[])');
	const parameterEncode1 = web3.eth.abi.encodeParameters(
		['bytes[]'],
		[
			[
				'0xac9650d80000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000004d0e30db000000000000000000000000000000000000000000000000000000000',
				'0xac9650d80000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000004d0e30db000000000000000000000000000000000000000000000000000000000',
			],
		],
	);
	// const funcEncode = web3.eth.abi.encodeParameter(
	// 	'bytes32',
	// 	'0x0000000000000000000000000000000000000000000000000000000000000000',
	// );

	// const functionSignature = {
	// 	name: 'proposeNewAdmin',
	// 	type: 'function',
	// 	inputs: [
	// 		{
	// 			type: 'address',
	// 			name: '_newAdmin',
	// 		},
	// 	],
	// };

	// params = ['']

	// data = web3.eth.abi.encodeFunctionCall(functionSignature, params)

	// await web3.eth.sendTransaction({from: '', to: '', data})

	// For checking
	console.log(funcEncode);
	console.log(parameterEncode);
	console.log(funcEncode1);
	console.log(parameterEncode1);
};

runTx();
