import { useWallet } from 'models/wallet';
import { useTWDFContract, useTWDFVaultContract } from 'models/vault';

import BalanceCard from 'components/BalanceCard';
import VaultCard from 'components/VaultCard';

interface DashboardProperty {
	address: string;
}

const Dashboard: React.FC<DashboardProperty> = ({ address }) => {
	const { isActive } = useWallet();
	const {
		mint: mintTWDF,
		balance: TWDFBalance,
		isNeedApprove,
		approve,
		getAllowance: getTWDFAllowance,
		getBalance: getTWDFBalance,
	} = useTWDFContract(address);
	const { balance: vTWDFBalance, deposit, withdraw, mint, redeem } = useTWDFVaultContract(address);

	return (
		<>
			<BalanceCard
				isActive={isActive}
				TWDFBalance={TWDFBalance}
				vTWDFBalance={vTWDFBalance}
				mint={mintTWDF}
			></BalanceCard>
			<VaultCard
				isActive={isActive}
				isNeedApprove={isNeedApprove}
				approve={approve}
				getTWDFAllowance={getTWDFAllowance}
				getTWDFBalance={getTWDFBalance}
				deposit={deposit}
				withdraw={withdraw}
				mint={mint}
				redeem={redeem}
			></VaultCard>
		</>
	);
};

export default Dashboard;
