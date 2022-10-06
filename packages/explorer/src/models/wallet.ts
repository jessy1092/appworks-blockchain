import React, { useContext, useEffect, useState } from 'react';
import Web3 from 'web3';
import { AbstractProvider } from 'web3-core';

export const isSupportWeb3 =
	typeof window.ethereum !== 'undefined' && typeof window.ethereum.request !== 'undefined';

export const isConnected = false;

export const checkConnection = async () => {
	if (isSupportWeb3) {
		const account = await window.ethereum?.request?.({ method: 'eth_accounts' });

		if (typeof account !== 'undefined' && account[0]) {
			console.log(account[0]);

			return account[0];
		}

		return '';
	}
};

export const Wallet = React.createContext<null | Web3>(null);

export const useWallet = () => {
	const wallet = useContext(Wallet);

	return {
		isActive: wallet !== null,
		wallet,
	};
};

export const useConnectWeb3 = () => {
	const [myWallet, setWallet] = useState<null | Web3>(null);
	const [address, setAddress] = useState('');

	const connect = async () => {
		if (isSupportWeb3) {
			await window.ethereum?.request?.({ method: 'eth_requestAccounts' });
			const web3 = new Web3(window.ethereum as AbstractProvider);

			setWallet(web3);

			const account = web3.eth.accounts;
			//Get the current MetaMask selected/active wallet
			const walletAddress = account.givenProvider.selectedAddress;
			console.log(`Wallet: ${walletAddress}`);
			setAddress(walletAddress);
		} else {
			console.log('No wallet');
		}
	};

	useEffect(() => {
		const fetchAccount = async () => {
			const address = await checkConnection();
			console.log(address);
			setAddress(address);

			if (address !== '') {
				const web3 = new Web3(window.ethereum as AbstractProvider);

				setWallet(web3);
			}
		};

		fetchAccount();
	}, []);

	return { myWallet, address, connect };
};
