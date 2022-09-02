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

	const funcEncode = web3.eth.abi.encodeFunctionSignature('claim(uint256)');
	const parameterEncode = web3.utils.stripHexPrefix(web3.eth.abi.encodeParameter('uint256', 1));

	// For checking
	console.log(
		funcEncode,
		parameterEncode,
		`${funcEncode}${parameterEncode}` ===
			'0x379607f50000000000000000000000000000000000000000000000000000000000000001',
	);

	const result = await web3.eth.accounts.signTransaction(
		{
			to: '0xd33C69361e00f01C3085ac77ab2fA13bE10376E8',
			gas: '2000000',
			data: `${funcEncode}${parameterEncode}`,
		},
		`0x${process.env.GOERLI_PRIVATE_KEY}`,
	);

	console.log(JSON.stringify(result, null, '  '));

	if (typeof result.rawTransaction != 'undefined') {
		const recipt = await web3.eth.sendSignedTransaction(result.rawTransaction);

		console.log(JSON.stringify(recipt, null, '  '));
	}
};

runTx();
