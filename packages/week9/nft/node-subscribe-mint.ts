import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import S3 from 'aws-sdk/clients/s3';
import * as dotenv from 'dotenv';
import fs from 'fs/promises';

dotenv.config({ path: '.env' });

import { AppWorksV3 as AppWorks } from '../web3-types/contracts';

import ContractData from '../.openzeppelin/goerli.json';
import AppWorksAbi from '../artifacts/contracts/AppWorksV3.sol/AppWorksV3.json';
import { Transfer } from '../web3-types/contracts/AppWorksV3';

const accountid = process.env.R2_ACCOUNT_ID;
const access_key_id = process.env.R2_ACCESS_KEY;
const access_key_secret = process.env.R2_ACCESS_KEY_SECRET;

const s3 = new S3({
	endpoint: `https://${accountid}.r2.cloudflarestorage.com`,
	accessKeyId: `${access_key_id}`,
	secretAccessKey: `${access_key_secret}`,
	signatureVersion: 'v4',
});

const uploadMetadata = async (tokenId: string) => {
	const data = await fs.readFile(`./nft/metadata/${tokenId}`);

	const params = {
		Body: data,
		Bucket: 'app-block',
		Key: `metadata/${tokenId}`,
		ContentType: 'application/json',
	};

	console.log(await s3.putObject(params).promise());
};

const subscribeMintEvent = () => {
	const web3Socket = new Web3(
		new Web3.providers.WebsocketProvider(
			`wss://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
		),
	);

	const myContract = new web3Socket.eth.Contract(
		AppWorksAbi.abi as AbiItem[],
		ContractData.proxies[0].address,
	) as any as AppWorks;

	const eventListenerHandler = (event: Transfer) => {
		console.log('Transfer Event');
		console.log(event); // same results as the optional callback above
		console.log(event.returnValues);

		const { from, to, tokenId } = event.returnValues;

		// console.log(from, to, tokenId);

		// mint event
		if (from === '0x0000000000000000000000000000000000000000') {
			uploadMetadata(tokenId);
		}
	};

	const eventListener = myContract.events
		.Transfer({})
		.on('connected', function (subscriptionId) {
			console.log(subscriptionId);
		})
		.on('data', eventListenerHandler);

	console.log('First Subscribe');

	return () => {
		console.log('cancel subscribe');
		eventListener.off('data', eventListenerHandler);
	};
};

subscribeMintEvent();
