import React, { useCallback, useContext, useEffect, useState } from 'react';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';

import TWDFAbi from '@app-block/erc4626/artifacts/contracts/TWDF.sol/TWDF.json';
import TWDFVaultAbi from '@app-block/erc4626/artifacts/contracts/TWDFVault.sol/TWDFVault.json';

import { normalizeNum } from '../utility';
import { TWDF_VAULT_CONTRACT } from './vault';
import { TWDF, TWDFVault } from '@app-block/erc4626/web3-types/contracts';

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

const TWDF_CONTRACT = '0xe37Df5eAa40850b440a40e8E11C0d722142A0fBD';

export const Wallet = React.createContext<null | Web3>(null);

export const useWallet = () => {
	const wallet = useContext(Wallet);

	return {
		isActive: wallet !== null,
		wallet,
	};
};

export const useTWDFContract = (myAddress: string) => {
	const { wallet } = useWallet();
	const [balance, setBalance] = useState<bigint>(0n);
	const [contract, setContract] = useState<null | TWDF>(null);
	const [isNeedApprove, setIsNeedApprove] = useState<boolean>(true);

	const getBalance = useCallback(async () => {
		if (contract !== null) {
			console.log('Get Balance?');
			const newBalance = await contract.methods.balanceOf(myAddress).call();

			console.log(newBalance);

			setBalance(normalizeNum(BigInt(newBalance)));
		}
	}, [contract, myAddress]);

	const getAllowance = useCallback(async () => {
		if (contract !== null) {
			console.log('Get Balance?');
			const newBalance = await contract.methods.allowance(myAddress, TWDF_VAULT_CONTRACT).call();

			console.log(newBalance);

			setIsNeedApprove(BigInt(newBalance) === 0n);
		}
	}, [contract, myAddress]);

	useEffect(() => {
		const getContract = async () => {
			if (wallet !== null) {
				const contract = new wallet.eth.Contract(TWDFAbi.abi as AbiItem[], TWDF_CONTRACT, {
					from: myAddress, // default from address
					gasPrice: '500000000',
				}) as any as TWDF;

				setContract(contract);
			}
		};

		getContract();
	}, [wallet, myAddress]);

	useEffect(() => {
		getBalance();
		getAllowance();
	}, [contract, getBalance, getAllowance]);

	const mint = async () => {
		console.log('mint??????', contract);
		if (contract !== null) {
			const recipt = await contract.methods.mint(myAddress).send();

			console.log('mint finish', recipt);

			await getBalance();
		}
	};

	const approve = async () => {
		console.log('approve??????', contract);
		if (contract !== null) {
			const recipt = await contract.methods
				.approve(TWDF_VAULT_CONTRACT, (balance * 10n ** 18n) as any)
				.send();

			console.log('approve finish', recipt);

			await getAllowance();
		}
	};

	return { balance, contract, mint, approve, isNeedApprove, getAllowance, getBalance };
};

export const useTWDFVaultContract = (myAddress: string) => {
	const { wallet } = useWallet();
	const [balance, setBalance] = useState<bigint>(0n);
	const [contract, setContract] = useState<null | TWDFVault>(null);

	const getBalance = useCallback(async () => {
		if (contract !== null) {
			console.log('Get Balance?');
			const newBalance = await contract.methods.balanceOf(myAddress).call();

			console.log(newBalance);

			setBalance(normalizeNum(BigInt(newBalance)));
		}
	}, [contract, myAddress]);

	const deposit = async (number: bigint) => {
		console.log('deposit??????', contract);
		if (contract !== null) {
			const recipt = await contract.methods.deposit((number * 10n ** 18n) as any, myAddress).send();

			console.log('deposit finish', recipt);

			await getBalance();
		}
	};

	const withdraw = async (number: bigint) => {
		console.log('withdraw??????', contract);
		if (contract !== null) {
			const recipt = await contract.methods
				.withdraw((number * 10n ** 18n) as any, myAddress, myAddress)
				.send();

			console.log('withdraw finish', recipt);

			await getBalance();
		}
	};

	const mint = async (number: bigint) => {
		console.log('mint??????', contract);
		if (contract !== null) {
			const recipt = await contract.methods.mint((number * 10n ** 18n) as any, myAddress).send();

			console.log('mint finish', recipt);

			await getBalance();
		}
	};

	const redeem = async (number: bigint) => {
		console.log('redeem??????', contract);
		if (contract !== null) {
			const recipt = await contract.methods
				.redeem((number * 10n ** 18n) as any, myAddress, myAddress)
				.send();

			console.log('redeem finish', recipt);

			await getBalance();
		}
	};

	useEffect(() => {
		const getContract = async () => {
			if (wallet !== null) {
				const contract = new wallet.eth.Contract(
					TWDFVaultAbi.abi as AbiItem[],
					TWDF_VAULT_CONTRACT,
					{
						from: myAddress, // default from address
						gasPrice: '500000000',
					},
				) as any as TWDFVault;

				setContract(contract);
			}
		};

		getContract();
	}, [wallet, myAddress]);

	useEffect(() => {
		getBalance();
	}, [contract, getBalance]);

	return { balance, contract, deposit, withdraw, mint, redeem };
};
