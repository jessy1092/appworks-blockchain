import Web3 from 'web3';
import { AbiItem } from 'web3-utils';

import * as dotenv from 'dotenv';

import Data from './artifacts/compound-protocol/contracts/Governance/GovernorBravoDelegate.sol/GovernorBravoDelegate.json';

dotenv.config({ path: '../../.env' });

const contractAddress = '0x363d9f03A40fADB7AF98D24aF185693474b1aF29';

const runTx = async () => {
	const web3 = new Web3(
		new Web3.providers.HttpProvider(
			`https://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
		),
	);

	const account = web3.eth.accounts.wallet.add(`0x${process.env.GOERLI_PRIVATE_KEY}`);

	const gasPrice = await web3.eth.getGasPrice();

	const myContract = new web3.eth.Contract(Data.abi as AbiItem[], contractAddress, {
		from: account.address, // default from address
		gasPrice: gasPrice,
		gas: 2000000,
	});

	// const result = await myContract.methods.name().call();

	const parameterEncode1 = web3.eth.abi.encodeParameters(['address'], [account.address]);

	console.log(parameterEncode1);

	const proposalRecipt = await myContract.methods
		.propose(
			['0x1D4A1056Df8598C90a81F37452B27faf3Bc5E57A'],
			[0],
			['_setPendingAdmin(address)'],
			[parameterEncode1],
			'',
		)
		.send()
		.once('transactionHash', (txHash: string) => {
			// get pending txhash
			console.log(txHash);
		});

	// console.log(result);
	console.log(proposalRecipt);
};

runTx();
