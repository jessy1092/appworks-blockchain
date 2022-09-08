import React from 'react';

import styles from './index.module.css';

const Home: React.FC = () => (
	<div>
		<div className={styles.welcome}>
			Welcome to
			<br />
			web starter
			<br />
			This is on {process.env.NODE_ENV} server
		</div>
	</div>
);

export default Home;
