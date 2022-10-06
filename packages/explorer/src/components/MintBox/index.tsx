import { ChangeEvent, useState } from 'react';

import { AppWorksState, useMyAppWorks } from 'models/appworks';

import styles from './index.module.css';

interface MintBoxProperty {
	className?: string;
	address: string;
	appWorksState: AppWorksState;
}

const MintBox: React.FC<MintBoxProperty> = ({ className, address, appWorksState }) => {
	const { mint, myAppWorksState } = useMyAppWorks(address);

	const [quantity, setQuantity] = useState<number>(0);

	const maxMintQuantity =
		address.toLowerCase() === appWorksState.owner.toLowerCase()
			? appWorksState.mintNumberPerOwner
			: appWorksState.mintNumberPerUser;

	const canMintQuantity = maxMintQuantity - myAppWorksState.balance;

	const onChangeQuantity = (e: ChangeEvent<HTMLInputElement>) => {
		try {
			const newQuantity = parseInt(e.target.value, 10);
			setQuantity(newQuantity);
		} catch (e) {
			console.log('Can not parse number');
		}
	};

	return (
		<div className={styles.mintBox}>
			<div>In Whitelist: {myAppWorksState.inWhitelist ? 'Yes' : 'No'}</div>
			<div>Can mint quantity: {canMintQuantity}</div>
			<div className={styles.action}>
				Mint Quantity:
				<input
					type="text"
					placeholder="Mint quantity"
					value={quantity.toString()}
					onChange={onChangeQuantity}
				></input>
				<button>+</button>
				<button>-</button>
				<button className={styles.mint}>Mint</button>
			</div>
		</div>
	);
};

export default MintBox;
