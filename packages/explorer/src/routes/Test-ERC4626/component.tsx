import styles from './index.module.css';

import Dashboard from 'components/Dashboard';
import { isSupportWeb3, useConnectWeb3, Wallet } from 'models/wallet';
import ButtonConnect from 'components/ButtonConnect';

function App() {
	const { myWallet, address, connect } = useConnectWeb3();

	return (
		<Wallet.Provider value={myWallet}>
			<div className={styles.app}>
				{isSupportWeb3 && (
					<>
						<ButtonConnect
							className={styles.connectButton}
							address={address}
							connect={connect}
						></ButtonConnect>

						<Dashboard address={address}></Dashboard>
					</>
				)}
			</div>
		</Wallet.Provider>
	);
}

export default App;
