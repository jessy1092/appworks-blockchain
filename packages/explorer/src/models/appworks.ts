import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { useEffect, useState, useCallback } from 'react';
import BigNumber from 'bignumber.js';

import { AppWorksV3 as AppWorks } from '@app-block/week9/web3-types/contracts';

import ContractData from '@app-block/week9/.openzeppelin/goerli.json';
import AppWorksAbi from '@app-block/week9/artifacts/contracts/AppWorksV3.sol/AppWorksV3.json';

import { useWallet } from './wallet';

interface normalEvent {
	returnValues: {
		caller: string;
		owner: string;
	};
}

export interface AppWorksState {
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
	) as any as AppWorks;

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

const getProof = async (address: string): Promise<string[]> => {
	try {
		const result = await fetch('https://appworks.lee-conn.workers.dev/whitelist', {
			method: 'POST',
			body: JSON.stringify({ address }),
		});

		const { data } = await result.json();

		return data;
	} catch (error) {
		return [];
	}
};

enum WhitelistStatus {
	YES = 'Yes',
	NO = 'No',
	IN_PROGRESS = 'In progress',
}

interface MyAppWorksState {
	balance: number;
	addressMintedBalance: number[];
	inWhitelist: WhitelistStatus;
	proof: string[];
}

export const useMyAppWorks = (myAddress: string) => {
	const { wallet } = useWallet();
	const [myAppWorksState, setMyAppWorksState] = useState<MyAppWorksState>({
		balance: 0,
		addressMintedBalance: [],
		inWhitelist: WhitelistStatus.NO,
		proof: [],
	});
	const [contract, setContract] = useState<null | AppWorks>(null);

	const getBalance = useCallback(async () => {
		if (contract !== null) {
			console.log('Get Balance?');
			const newBalance = await contract.methods.balanceOf(myAddress).call();

			setMyAppWorksState(s => ({ ...s, balance: parseInt(newBalance, 10) }));
		}
	}, [contract, myAddress]);

	const getAddressMintedBalance = useCallback(async () => {
		if (contract !== null) {
			console.log('Get Balance?');
			const newMintedTokenBitMap = await contract.methods.addressMintedBalance(myAddress).call();

			const addressMintedBalance = new BigNumber(newMintedTokenBitMap.toString())
				.toString(2)
				.split('')
				.reverse()
				.reduce((p: number[], c, i) => {
					if (c === '1') {
						p.push(i + 1);
					}
					return p;
				}, []);

			setMyAppWorksState(s => ({ ...s, addressMintedBalance }));
		}
	}, [contract, myAddress]);

	const mint = async (number: number) => {
		console.log('mint??????', contract);
		if (contract !== null) {
			const recipt = await contract.methods.mint(number).send({
				value: Web3.utils.toWei(new BigNumber(number).multipliedBy(0.01).toString(), 'ether'),
			});

			console.log('mint finish', recipt);

			await Promise.all([getBalance(), getAddressMintedBalance()]);
		}
	};

	const earlyMint = async (number: number) => {
		console.log('early mint??????', contract);
		if (contract !== null && myAppWorksState.proof.length > 0) {
			const recipt = await contract.methods.earlyMint(myAppWorksState.proof, number).send({
				value: Web3.utils.toWei(new BigNumber(number).multipliedBy(0.01).toString(), 'ether'),
			});

			console.log('early, mint finish', recipt);

			await Promise.all([getBalance(), getAddressMintedBalance()]);
		}
	};

	const checkInWhitelist = useCallback(async () => {
		if (contract !== null) {
			const proof = await getProof(myAddress);

			if (proof.length === 0) {
				console.log('Not in whitelist');
				setMyAppWorksState(s => ({ ...s, inWhitelist: WhitelistStatus.NO }));
				return;
			}

			setMyAppWorksState(s => ({ ...s, inWhitelist: WhitelistStatus.IN_PROGRESS }));

			console.log('Check in whitelist?', proof, myAddress);
			const newBalance = await contract.methods.checkInWhitelist(proof).call();

			console.log(newBalance);

			if (newBalance) {
				setMyAppWorksState(s => ({ ...s, inWhitelist: WhitelistStatus.YES, proof }));
			}
		}
	}, [contract, myAddress]);

	useEffect(() => {
		const getContract = async () => {
			if (wallet !== null) {
				const gasPrice = await wallet.eth.getGasPrice();

				const contract = new wallet.eth.Contract(
					AppWorksAbi.abi as AbiItem[],
					ContractData.proxies[0].address,
					{
						from: myAddress, // default from address
						gasPrice,
					},
				) as any as AppWorks;

				setContract(contract);
			}
		};

		getContract();
	}, [wallet, myAddress]);

	useEffect(() => {
		getBalance();
		getAddressMintedBalance();
		checkInWhitelist();
	}, [getBalance, getAddressMintedBalance, checkInWhitelist]);

	return { contract, mint, myAppWorksState, earlyMint };
};
