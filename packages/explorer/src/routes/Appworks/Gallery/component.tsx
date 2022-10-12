import React from 'react';

import { useAppWorks } from 'models/appworks';
import { useConnectWeb3, Wallet } from 'models/wallet';

import styles from './index.module.css';
import ButtonConnect from 'components/ButtonConnect';
import { range } from 'utility';

const Home: React.FC = () => {
	const appWorksState = useAppWorks();
	const { myWallet, address, connect } = useConnectWeb3();

	return (
		<Wallet.Provider value={myWallet}>
			<div className={styles.gallery}>
				<ButtonConnect address={address} connect={connect}></ButtonConnect>
				<div className={styles.container}>
					<h2>All NFT</h2>
					<div className={styles.list}>
						{range(1, appWorksState.totalSupply).map(id => (
							<div className={styles.card}>
								<img
									src="https://pub-a643c8f17c284976bce3b03942a4ef02.r2.dev/images/00062-374625499-a%20Beautiful%20blind%20box%20at%20night%2C%20by%20Christopher%20Balaska.png"
									alt="blind"
								></img>
								<div className={styles.title}>AppWorks #{id}</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</Wallet.Provider>
	);
};

export default Home;
