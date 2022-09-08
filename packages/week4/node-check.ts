import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import * as dotenv from 'dotenv';
import fs from 'fs';

const abi = JSON.parse(fs.readFileSync('./abi.json', 'utf-8'));

dotenv.config({ path: '../../.env' });

const runCheck = async () => {
	const contractAddress = '0xd33C69361e00f01C3085ac77ab2fA13bE10376E8';
	const detectAddress = '0xb7843B80400c3695DAF77fE36DaAD2fa1015807c';

	const web3 = new Web3(
		new Web3.providers.HttpProvider(
			`https://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
		),
	);

	web3.eth.defaultChain = 'goerli';

	const myContract = new web3.eth.Contract(abi as AbiItem[], contractAddress);

	const depositedResult = await myContract.methods.deposited(detectAddress).call();

	console.log(JSON.stringify(depositedResult, null, '  '));

	const claimedResult = await myContract.methods.claimed(detectAddress).call();

	console.log(JSON.stringify(claimedResult, null, '  '));

	const scoreResult = await myContract.methods.score(detectAddress).call();

	console.log(JSON.stringify(scoreResult, null, '  '));
};

runCheck();
