import React from 'react';

import styles from './index.module.css';

const Home: React.FC = () => (
	<div className={styles.appworks}>
		<div className={styles.bgcontainer}></div>
		<div className={styles.container}>
			<div className={styles.title}>AppWorks Art NFT</div>
			<div className={styles.subTitle}>Next generation art about school</div>

			<button>Connect Wallet</button>
		</div>
	</div>
);

export default Home;
