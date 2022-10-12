import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import Link from 'components/Link';

import { State } from 'models/reducers';
import { useAppWorks } from 'models/appworks';
import { getBlindMetadata, getMetadata, State as MetadataState, Metadata } from 'models/metadata';

import styles from './index.module.css';

interface NFTProps {
	data: Metadata;
	id: string;
}

const NFT: React.FC<NFTProps> = ({ id, data }) => (
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
		{id !== 'blind' && (
			<a
				className={styles.link}
				href={`https://testnets.opensea.io/assets/goerli/0x753bf3bd4b205240aa65a170e174e3c0ed3369ee/${id}`}
				target="_blank"
				rel="noreferrer"
			>
				On the OpenSea
			</a>
		)}
		<Link className={styles.link} href="/appworks/gallery">
			Back to the gallery
		</Link>
	</div>
);

interface BlindNFTProps {
	baseURI: string;
	metadata: MetadataState;
}

const BlindNFT: React.FC<BlindNFTProps> = ({ metadata, baseURI }) => {
	const dispatch = useDispatch();
	// const metadata = useSelector((state: State) => state.metadata.data);

	useEffect(() => {
		dispatch(getBlindMetadata(baseURI));
	}, [dispatch, baseURI]);

	if (!Object.keys(metadata.data).includes('blind')) {
		return null;
	}

	return <NFT id={metadata.show} data={metadata.data.blind}></NFT>;
};

interface NormalNFTProps {
	baseURI: string;
	totalSupply: number;
	metadata: MetadataState;
}

const NormalNFT: React.FC<NormalNFTProps> = ({ metadata, baseURI, totalSupply }) => {
	// const { myWallet } = useConnectWeb3();
	const dispatch = useDispatch();

	const id = parseInt(metadata.show, 10);

	useEffect(() => {
		if (id <= totalSupply) {
			dispatch(getMetadata(baseURI, [id]));
		}
	}, [dispatch, totalSupply, baseURI, id]);

	if (id > totalSupply) {
		return null;
	}

	return <NFT id={metadata.show} data={metadata.data[id]}></NFT>;
};

const Home: React.FC = () => {
	const appWorksState = useAppWorks();

	const metadata = useSelector((state: State) => state.metadata);

	if (appWorksState.baseURI !== '') {
		if (metadata.show === 'blind' || !appWorksState.revealed) {
			return <BlindNFT metadata={metadata} baseURI={appWorksState.baseURI}></BlindNFT>;
		} else {
			return (
				<NormalNFT
					metadata={metadata}
					baseURI={appWorksState.baseURI}
					totalSupply={appWorksState.totalSupply}
				></NormalNFT>
			);
		}
	}

	return null;
};

export default Home;
