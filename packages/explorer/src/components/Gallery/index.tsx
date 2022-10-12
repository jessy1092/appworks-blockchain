import { getBlindMetadata } from 'models/metadata';
import { State } from 'models/reducers';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styles from './index.module.css';

interface GalleryProperty {
	className?: string;
	data: number[];
	revealed: boolean;
}

const Gallery: React.FC<GalleryProperty> = ({ className, data, revealed }) => {
	const dispatch = useDispatch();
	const metadata = useSelector((state: State) => state.metadata.data);

	useEffect(() => {
		if (!revealed) {
			dispatch(getBlindMetadata());
		}
	}, [revealed, dispatch]);

	return (
		<div className={styles.gallery}>
			{data.map(id => {
				if (revealed && Object.keys(metadata).includes(id.toString())) {
					return (
						<div className={styles.card} key={id}>
							<img src={metadata[id].image} alt={`nft #${id}`}></img>
							<div className={styles.title}>AppWorks #{id}</div>
						</div>
					);
				}

				return (
					<div className={styles.card} key={id}>
						<img src={metadata.blind.image} alt="blind"></img>
						<div className={styles.title}>AppWorks #{id}</div>
					</div>
				);
			})}
		</div>
	);
};

export default Gallery;
