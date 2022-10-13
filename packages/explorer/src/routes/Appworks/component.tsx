import React from 'react';

import { useAppWorks } from 'models/appworks';
import { useConnectWeb3, Wallet } from 'models/wallet';

import ButtonConnect from 'components/ButtonConnect';
import MintBox from 'components/MintBox';

import styles from './index.module.css';
import Link from 'components/Link';

const AppWroks: React.FC = () => {
	const appWorksState = useAppWorks();
	const { myWallet, address, connect } = useConnectWeb3();

	return (
		<Wallet.Provider value={myWallet}>
			<div className={styles.appworks}>
				<div className={styles.bgcontainer}></div>
				<div className={styles.mask}></div>
				<div className={styles.container}>
					<div className={styles.title}>AppWorks Art NFT</div>
					<div className={styles.subTitle}>Next generation art about school</div>
					<div className={styles.detail}>
						<div className={styles.left}>
							<div className={styles.time}>Early Mint: 10/11</div>
							<div className={styles.time}>Public Mint: 10/13</div>
							<div className={styles.time}>Reveal: 10/15</div>
							<div className={styles.time}>Price: {appWorksState.price.toString()} GoerliETH</div>
						</div>
						<div>
							<div className={styles.status}>
								Minted: {appWorksState.totalSupply} / Total: {appWorksState.maxSupply}
							</div>
							<Link className={styles.link} href="/appworks/gallery">
								Go to the gallery
							</Link>
						</div>
					</div>

					<ButtonConnect
						className={styles.address}
						address={address}
						connect={connect}
					></ButtonConnect>
					{address !== '' && (
						<MintBox
							className={styles.box}
							appWorksState={appWorksState}
							address={address}
						></MintBox>
					)}
				</div>
			</div>
		</Wallet.Provider>
	);
};

export default AppWroks;
