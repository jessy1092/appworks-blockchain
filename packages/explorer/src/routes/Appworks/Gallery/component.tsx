import React from 'react';

import { useAppWorks } from 'models/appworks';
import { useConnectWeb3, Wallet } from 'models/wallet';

import styles from './index.module.css';
import ButtonConnect from 'components/ButtonConnect';
import { range } from 'utility';
import Gallery from 'components/Gallery';

const Home: React.FC = () => {
	const appWorksState = useAppWorks();
	const { myWallet, address, connect } = useConnectWeb3();

	const allData = range(1, appWorksState.totalSupply);

	return (
		<Wallet.Provider value={myWallet}>
			<div className={styles.gallery}>
				<ButtonConnect address={address} connect={connect}></ButtonConnect>
				<div className={styles.container}>
					<h2>All NFT</h2>
					<div className={styles.list}>
						<Gallery data={allData} revealed={appWorksState.revealed}></Gallery>
					</div>
				</div>
			</div>
		</Wallet.Provider>
	);
};

export default Home;
