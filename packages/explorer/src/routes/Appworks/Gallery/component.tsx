import React from 'react';

import { useConnectWeb3, Wallet } from 'models/wallet';

import styles from './index.module.css';

const Home: React.FC = () => {
	const { myWallet } = useConnectWeb3();

	return (
		<Wallet.Provider value={myWallet}>
			{/* <ButtonConnect address={address} connect={connect}></ButtonConnect> */}
			<div className={styles.nft}></div>
		</Wallet.Provider>
	);
};

export default Home;
