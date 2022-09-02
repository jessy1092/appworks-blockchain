import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { useEffect, useState } from 'react';

import TWDFVaultAbi from '@app-block/erc4626/artifacts/contracts/TWDFVault.sol/TWDFVault.json';
import { TWDFVault } from '@app-block/erc4626/web3-types/contracts';

import { normalizeNum } from '../utility';

export const TWDF_VAULT_CONTRACT = '0xe243ee6884f9f05bc38ca7e0206e3bd6aabbc5b0';

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
