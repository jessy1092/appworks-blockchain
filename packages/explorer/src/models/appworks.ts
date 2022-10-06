import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { useEffect, useState } from 'react';

import { AppWorksV3 } from '@app-block/week9/web3-types/contracts';

import ContractData from '@app-block/week9/.openzeppelin/goerli.json';
import AppWorksAbi from '@app-block/week9/artifacts/contracts/AppWorksV3.sol/AppWorksV3.json';

interface normalEvent {
	returnValues: {
		caller: string;
		owner: string;
	};
}

interface AppWorksState {
	baseURI: string;
	earlyMintActive: boolean;
	maxSupply: number;
	merkleRoot: string;
	mintActive: boolean;
	mintNumberPerUser: number;
	mintNumberPerOwner: number;
	name: string;
	owner: string;
	price: number;
	revealed: boolean;
	symbol: string;
	totalSupply: number;
}

const subscribeAppWorks = (onUpdate = (t: AppWorksState) => {}) => {
	const web3Socket = new Web3(
		new Web3.providers.WebsocketProvider(
			`wss://eth-goerli.g.alchemy.com/v2/${process.env.REACT_APP_WEBSOCKET_KEY}`,
		),
	);

	const myContract = new web3Socket.eth.Contract(
		AppWorksAbi.abi as AbiItem[],
		ContractData.proxies[0].address,
	) as any as AppWorksV3;

	const update = async () => {
		console.log('Update AppWorks State');
		const [
			baseURI,
			earlyMintActive,
			maxSupply,
			merkleRoot,
			mintActive,
			mintNumberPerUser,
			mintNumberPerOwner,
			name,
			owner,
			price,
			revealed,
			symbol,
			totalSupply,
		] = await Promise.all([
			myContract.methods.baseURI().call(),
			myContract.methods.earlyMintActive().call(),
			myContract.methods.maxSupply().call(),
			myContract.methods.merkleRoot().call(),
			myContract.methods.mintActive().call(),
			myContract.methods.mintNumberPerUser().call(),
			myContract.methods.mintNumberPerOwner().call(),
			myContract.methods.name().call(),
			myContract.methods.owner().call(),
			myContract.methods.price().call(),
			myContract.methods.revealed().call(),
			myContract.methods.symbol().call(),
			myContract.methods.totalSupply().call(),
		]);

		onUpdate({
			baseURI,
			earlyMintActive,
			maxSupply: parseInt(maxSupply, 10),
			merkleRoot,
			mintActive,
			mintNumberPerUser: parseInt(mintNumberPerUser, 10),
			mintNumberPerOwner: parseInt(mintNumberPerOwner, 10),
			name,
			owner,
			price: parseFloat(Web3.utils.fromWei(price, 'ether')),
			revealed,
			symbol,
			totalSupply: parseInt(totalSupply, 10),
		});
	};

	const eventListenerHandler = (event: normalEvent) => {
		console.log('all Event');
		console.log(event); // same results as the optional callback above
		console.log(event.returnValues);
		update();
	};

	const eventListener = myContract.events.allEvents({}).on('data', eventListenerHandler);

	console.log('First Subscribe');
	// First Init
	update();

	return () => {
		console.log('cancel subscribe');
		eventListener.off('data', eventListenerHandler);
	};
};

export const useAppWorks = () => {
	const [appWorksState, setAppWorksState] = useState<AppWorksState>({
		baseURI: '',
		earlyMintActive: false,
		maxSupply: 0,
		merkleRoot: '',
		mintActive: false,
		mintNumberPerUser: 0,
		mintNumberPerOwner: 0,
		name: '',
		owner: '',
		price: 0,
		revealed: false,
		symbol: '',
		totalSupply: 0,
	});

	useEffect(() => {
		const unSubscribe = subscribeAppWorks(result => {
			setAppWorksState(result);
		});

		return unSubscribe;
	}, []);

	return appWorksState;
};
