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

	const funcEncode = web3.eth.abi.encodeFunctionSignature('pwn()');
	// const funcEncode = web3.eth.abi.encodeParameter(
	// 	'bytes32',
	// 	'0x0000000000000000000000000000000000000000000000000000000000000000',
	// );

	// For checking
	console.log(funcEncode);
};

runTx();
