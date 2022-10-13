import { ChangeEvent, useEffect, useState } from 'react';
import classnames from 'classnames';

import { AppWorksState, useMyAppWorks } from 'models/appworks';

import styles from './index.module.css';

interface MintBoxProperty {
	className?: string;
	address: string;
	appWorksState: AppWorksState;
}

const MintBox: React.FC<MintBoxProperty> = ({ className, address, appWorksState }) => {
	const { mint, earlyMint, myAppWorksState, transaction } = useMyAppWorks(address);

	const [quantity, setQuantity] = useState<number>(1);

	const maxMintQuantity =
		address.toLowerCase() === appWorksState.owner.toLowerCase()
			? appWorksState.mintNumberPerOwner
			: appWorksState.mintNumberPerUser;

	const canMintQuantity = maxMintQuantity - myAppWorksState.balance;

	const canMint =
		(appWorksState.earlyMintActive && myAppWorksState.inWhitelist) || appWorksState.mintActive;

	const leftQuantity = appWorksState.maxSupply - appWorksState.totalSupply;

	const onMint = () => {
		if (quantity <= 0 || quantity > leftQuantity || quantity > canMintQuantity) {
			console.log('Invalid mint quantity', quantity);
			return;
		}

		if (appWorksState.mintActive && quantity > 0) {
			mint(quantity);
			return;
		}

		if (appWorksState.earlyMintActive && quantity > 0) {
			earlyMint(quantity);
		}
	};

	const onChangeQuantity = (e: ChangeEvent<HTMLInputElement>) => {
		try {
			const newQuantity = parseInt(e.target.value, 10);

			if (newQuantity <= canMintQuantity && newQuantity > 0 && newQuantity <= leftQuantity) {
				setQuantity(newQuantity);
			}
		} catch (e) {
			console.log('Can not parse number');
		}
	};

	const increaseQuantity = () => {
		if (quantity + 1 <= canMintQuantity && quantity + 1 <= leftQuantity) {
			setQuantity(quantity + 1);
		}
	};

	const decreaseQuantity = () => {
		if (quantity - 1 > 0) {
			setQuantity(quantity - 1);
		}
	};

	useEffect(() => {
		// No quantity
		if (myAppWorksState.balance !== 0 && canMintQuantity === 0 && quantity !== 0) {
			setQuantity(0);
		}
	}, [canMintQuantity, quantity, myAppWorksState.balance]);

	return (
		<div className={classnames(className, styles.mintBox)}>
			<div>In Whitelist: {myAppWorksState.inWhitelist}</div>
			<div>Can mint quantity: {canMintQuantity}</div>
			{canMint && canMintQuantity > 0 && (
				<div className={styles.action}>
					Mint Quantity:
					<input
						type="text"
						placeholder="Mint quantity"
						value={quantity.toString()}
						onChange={onChangeQuantity}
					></input>
					<button onClick={increaseQuantity}>+</button>
					<button onClick={decreaseQuantity}>-</button>
					<button className={styles.mint} onClick={onMint}>
						Mint
					</button>
				</div>
			)}
			{transaction.hash !== '' && (
				<div>
					{transaction.status}:{' '}
					<a
						href={`https://goerli.etherscan.io/tx/${transaction.hash}`}
						target="_blank"
						rel="noreferrer"
					>
						{transaction.hash}
					</a>
				</div>
			)}
		</div>
	);
};

export default MintBox;
