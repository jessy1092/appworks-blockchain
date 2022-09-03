import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import * as dotenv from 'dotenv';

import TWDFVaultAbi from '@app-block/erc4626/artifacts/contracts/TWDFVault.sol/TWDFVault.json';
import { TWDFVault } from '@app-block/erc4626/web3-types/contracts';
import { TWDF_VAULT_CONTRACT } from '@app-block/erc4626';
import { Deposit, Withdraw } from '@app-block/erc4626/web3-types/contracts/TWDFVault';

dotenv.config({ path: '../../.env' });

// const options = {
// 	timeout: 30000, // ms

// 	// Useful if requests result are large
// 	clientConfig: {
// 		maxReceivedFrameSize: 100000000, // bytes - default: 1MiB
// 		maxReceivedMessageSize: 100000000, // bytes - default: 8MiB
// 	},

// 	// Enable auto reconnection
// 	reconnect: {
// 		auto: true,
// 		delay: 5000, // ms
// 		maxAttempts: 5,
// 		onTimeout: false,
// 	},
// };

const web3 = new Web3(
	new Web3.providers.WebsocketProvider(
		`wss://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
	),
);

const TWDFVaultContract = new web3.eth.Contract(
	TWDFVaultAbi.abi as AbiItem[],
	TWDF_VAULT_CONTRACT,
) as any as TWDFVault;

TWDFVaultContract.events.Deposit({}).on('data', function (event: Deposit) {
	console.log(JSON.stringify(event, null, '  '));
	console.log(event.returnValues);
});

TWDFVaultContract.events.Withdraw({}).on('data', function (event: Withdraw) {
	console.log(JSON.stringify(event, null, '  '));
	console.log(event.returnValues);
});

const getPastEvent = async () => {
	// Get all event
	// const result = await TWDFVaultContract.getPastEvents('allEvents');

	const result = await TWDFVaultContract.getPastEvents('Deposit', {
		filter: { caller: '0x1A24f7B01087665AF51EfC816aC1a96D813C6db5' },
		fromBlock: 0,
		toBlock: 'latest',
	});

	console.log(JSON.stringify(result, null, '  '));
};

getPastEvent();
