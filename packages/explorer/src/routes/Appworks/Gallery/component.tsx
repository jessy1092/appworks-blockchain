import React, { useState } from 'react';

import { useAppWorks, useMyAppWorks } from 'models/appworks';
import { useConnectWeb3, Wallet } from 'models/wallet';

import styles from './index.module.css';
import ButtonConnect from 'components/ButtonConnect';
import { range } from 'utility';
import Gallery from 'components/Gallery';

interface ContainerProp {
	address: string;
}

const Container: React.FC<ContainerProp> = ({ address }) => {
	const appWorksState = useAppWorks();
	const [filterMyNFT, setFilterMyNFT] = useState<boolean>(false);
	const { myAppWorksState } = useMyAppWorks(address);

	const data = filterMyNFT
		? myAppWorksState.addressMintedBalance
		: range(1, appWorksState.totalSupply);

	const onToggle = () => {
		setFilterMyNFT(!filterMyNFT);
	};

	return (
		<div className={styles.container}>
			<div className={styles.head}>
				<h2>{filterMyNFT ? 'My' : 'All'} NFT </h2>
				{address !== '' && (
					<button onClick={onToggle}>{filterMyNFT ? 'Show All NFT' : 'Show My NFT'}</button>
				)}
			</div>
			<div className={styles.list}>
				<Gallery
					data={data}
					revealed={appWorksState.revealed}
					baseURI={appWorksState.baseURI}
				></Gallery>
			</div>
		</div>
	);
};

const Home: React.FC = () => {
	const { myWallet, address, connect } = useConnectWeb3();

	return (
		<Wallet.Provider value={myWallet}>
			<div className={styles.gallery}>
				<ButtonConnect address={address} connect={connect}></ButtonConnect>
				<Container address={address}></Container>
			</div>
		</Wallet.Provider>
	);
};

export default Home;
