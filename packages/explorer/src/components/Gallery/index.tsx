import { getBlindMetadata, getMetadata } from 'models/metadata';
import { State } from 'models/reducers';
import { useHistory } from 'models/routing';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styles from './index.module.css';

interface GalleryProperty {
	className?: string;
	data: number[];
	revealed: boolean;
	baseURI: string;
}

const Gallery: React.FC<GalleryProperty> = ({ className, data, revealed, baseURI }) => {
	const dispatch = useDispatch();
	const metadata = useSelector((state: State) => state.metadata.data);
	const history = useHistory();

	useEffect(() => {
		if (baseURI !== '') {
			if (!revealed) {
				dispatch(getBlindMetadata(baseURI));
			} else {
				dispatch(getMetadata(baseURI, data));
			}
		}
	}, [revealed, dispatch, baseURI, data]);

	const onCardClick = (id: number) => {
		history.push(`/appworks/gallery/${id}`);
	};

	return (
		<div className={styles.gallery}>
			{data.map(id => {
				if (revealed && Object.keys(metadata).includes(id.toString())) {
					return (
						<div className={styles.card} key={id} onClick={() => onCardClick(id)}>
							<img src={metadata[id].image} alt={`nft #${id}`}></img>
							<div className={styles.title}>AppWorks #{id}</div>
						</div>
					);
				}

				return (
					<div className={styles.card} key={id} onClick={() => onCardClick(id)}>
						<img src={metadata?.blind?.image} alt="blind"></img>
						<div className={styles.title}>AppWorks #{id}</div>
					</div>
				);
			})}
		</div>
	);
};

export default Gallery;
