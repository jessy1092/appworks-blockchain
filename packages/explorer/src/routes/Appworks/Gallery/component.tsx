import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { State } from 'models/reducers';
import { useAppWorks } from 'models/appworks';

import styles from './index.module.css';
import { getBlindMetadata, getMetadata, Metadata } from 'models/metadata';

interface NFTProps {
	data: Metadata;
}

const NFT: React.FC<NFTProps> = ({ data }) => (
	<div className={styles.nft}>
		<img src={data.image} alt="blind"></img>
		<h2>Name</h2>
		<div>{data.name}</div>
		<h2>Description</h2>
		<div>{data.description}</div>
		{data.attributes.map(attribute => (
			<div key={attribute.trait_type}>
				<h2>{attribute.trait_type}</h2>
				<div>{attribute.value}</div>
			</div>
		))}
	</div>
);

interface BlindNFTProps {
	baseURI: string;
}

const BlindNFT: React.FC<BlindNFTProps> = ({ baseURI }) => {
	const dispatch = useDispatch();
	const metadata = useSelector((state: State) => state.metadata.data);

	useEffect(() => {
		dispatch(getBlindMetadata(baseURI));
	}, [dispatch, baseURI]);

	if (!Object.keys(metadata).includes('blind')) {
		return null;
	}

	return <NFT data={metadata.blind}></NFT>;
};

interface NormalNFTProps {
	baseURI: string;
	totalSupply: number;
}

const NormalNFT: React.FC<NormalNFTProps> = ({ baseURI, totalSupply }) => {
	// const { myWallet } = useConnectWeb3();
	const dispatch = useDispatch();
	const metadata = useSelector((state: State) => state.metadata);

	const id = parseInt(metadata.show, 10);

	useEffect(() => {
		if (id <= totalSupply) {
			dispatch(getMetadata(baseURI, [id]));
		}
	}, [dispatch, totalSupply, baseURI, id]);

	if (id > totalSupply) {
		return null;
	}

	return <NFT data={metadata.data[id]}></NFT>;
};

const Home: React.FC = () => {
	const appWorksState = useAppWorks();

	const metadata = useSelector((state: State) => state.metadata);

	if (appWorksState.baseURI !== '') {
		if (metadata.show === 'blind' || !appWorksState.revealed) {
			return <BlindNFT baseURI={appWorksState.baseURI}></BlindNFT>;
		} else {
			return (
				<NormalNFT
					baseURI={appWorksState.baseURI}
					totalSupply={appWorksState.totalSupply}
				></NormalNFT>
			);
		}
	}

	return null;
};

export default Home;
