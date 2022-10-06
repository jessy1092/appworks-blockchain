import React from 'react';

import { useAppWorks } from 'models/appworks';
import { useConnectWeb3, Wallet } from 'models/wallet';

import styles from './index.module.css';
import ButtonConnect from 'components/ButtonConnect';

const Home: React.FC = () => {
	const appWorksState = useAppWorks();
	const { myWallet, address, connect } = useConnectWeb3();

	return (
		<Wallet.Provider value={myWallet}>
			<div className={styles.appworks}>
				<div className={styles.bgcontainer}></div>
				<div className={styles.container}>
					<div className={styles.title}>AppWorks Art NFT</div>
					<div className={styles.subTitle}>Next generation art about school</div>

					<div className={styles.time}>Early Mint: 10/11</div>
					<div className={styles.time}>Public Mint: 10/13</div>
					<div className={styles.time}>Reveal: 10/15</div>
					<div className={styles.time}>Price: {appWorksState.price.toString()} GoerliETH</div>

					<ButtonConnect address={address} connect={connect}></ButtonConnect>
				</div>
			</div>
		</Wallet.Provider>
	);
};

export default Home;
