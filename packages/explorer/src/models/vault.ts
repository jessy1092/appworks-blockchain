import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { useCallback, useEffect, useState } from 'react';

import { TWDF_CONTRACT, TWDF_VAULT_CONTRACT } from '@app-block/erc4626';
import TWDFVaultAbi from '@app-block/erc4626/artifacts/contracts/TWDFVault.sol/TWDFVault.json';
import TWDFAbi from '@app-block/erc4626/artifacts/contracts/TWDF.sol/TWDF.json';
import { TWDF, TWDFVault } from '@app-block/erc4626/web3-types/contracts';

import { normalizeNum } from '../utility';

import { useWallet } from './wallet';

interface VaultEvent {
	returnValues: {
		caller: string;
		owner: string;
		assets: string;
		shares: string;
		receiver?: string;
	};
}

interface UpdateProperty {
	totalAssets: bigint;
	totalSupply: bigint;
}

export const subscribeVault = (onUpdate = (t: UpdateProperty) => {}) => {
	const web3Socket = new Web3(
		new Web3.providers.WebsocketProvider(
			`wss://eth-goerli.g.alchemy.com/v2/${process.env.REACT_APP_WEBSOCKET_KEY}`,
		),
	);

	// web3Socket.eth.defaultChain = 'goerli';

	const myContract = new web3Socket.eth.Contract(
		TWDFVaultAbi.abi as AbiItem[],
		TWDF_VAULT_CONTRACT,
	) as any as TWDFVault;

	const update = async () => {
		console.log('Get total asset?');
		const [totalAssets, totalSupply] = await Promise.all([
			myContract.methods.totalAssets().call(),
			myContract.methods.totalSupply().call(),
		]);
		// const totalAssets = await myContract.methods.totalAssets().call();

		console.log(totalAssets);

		onUpdate({
			totalAssets: normalizeNum(BigInt(totalAssets)),
			totalSupply: normalizeNum(BigInt(totalSupply)),
		});
	};

	const depositListenerHandler = (event: VaultEvent) => {
		console.log('Deposit Event');
		console.log(event); // same results as the optional callback above
		console.log(event.returnValues);
		console.log(event.returnValues.assets);
		console.log(event.returnValues.shares);
		update();
	};

	const depositListener = myContract.events.Deposit({}).on('data', depositListenerHandler);

	const withdrawListenerHandler = (event: VaultEvent) => {
		console.log('Withdraw Event');
		console.log(event); // same results as the optional callback above
		console.log(event.returnValues);
		console.log(event.returnValues.assets);
		console.log(event.returnValues.shares);
		update();
	};

	const withdrawListener = myContract.events.Withdraw({}).on('data', withdrawListenerHandler);

	console.log('First Subscribe');
	// First Init
	update();

	return () => {
		console.log('cancel subscribe');
		depositListener.off('data', depositListenerHandler);
		withdrawListener.off('data', withdrawListenerHandler);
	};
};

export const useVault = () => {
	const [totalAssets, setTotalAssets] = useState<bigint>(0n);
	const [totalSupply, setTotalSupply] = useState<bigint>(0n);

	useEffect(() => {
		const unSubscribe = subscribeVault(result => {
			setTotalAssets(result.totalAssets);
			setTotalSupply(result.totalSupply);
		});

		return unSubscribe;
	}, []);

	return { totalAssets, totalSupply };
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
