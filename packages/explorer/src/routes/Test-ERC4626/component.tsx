import styles from './index.module.css';

import Dashboard from 'components/Dashboard';
import { isSupportWeb3, useConnectWeb3, Wallet } from 'models/wallet';

function App() {
	const { myWallet, address, connect } = useConnectWeb3();

	return (
		<Wallet.Provider value={myWallet}>
			<div className={styles.app}>
				{isSupportWeb3 && (
					<>
						{address === '' ? (
							<button className={styles.address} onClick={connect}>
								Connect MetaMask
							</button>
						) : (
							<div className={styles.address}>Wallet: {address}</div>
						)}

						<Dashboard address={address}></Dashboard>
					</>
				)}
			</div>
		</Wallet.Provider>
	);
}

export default App;
