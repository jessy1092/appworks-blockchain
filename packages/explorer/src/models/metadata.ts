import { Action, createAction, handleActions } from 'redux-actions';

interface Attributes {
	trait_type: string;
	value: string | number;
	display_type?: string;
}

export interface Metadata {
	description: string;
	external_url: string;
	image: string;
	name: string;
	attributes: Attributes[];
}

interface GetMetadataReturn {
	[id: string]: Metadata;
}

export const getMetadata = createAction<Promise<GetMetadataReturn>, string, number[]>(
	'GET_METADATA',
	async (baseURI, ids) => {
		const data = await Promise.all(
			ids.map(async id => {
				const result = await fetch(`${baseURI}${id}`);
				return result.json();
			}),
		);

		const metadata: GetMetadataReturn = {};

		ids.forEach((id, index) => {
			metadata[id] = data[index];
		});

		return metadata;
	},
);

export const getBlindMetadata = createAction<Promise<GetMetadataReturn>, string>(
	'GET_METADATA',
	async baseURI => {
		const result = await fetch(`${baseURI}blind`);

		const data = await result.json();

		return { blind: data };
	},
);

export const setupShowNFTId = createAction<string, string>('SETUP_SHOW_NFT_ID', id => id);

export type State = {
	data: {
		[id: string]: Metadata;
	};
	show: string;
};

export const defaultState: State = { data: {}, show: 'blind' };

export const reducer = {
	metadata: handleActions<State, any>(
		{
			GET_METADATA_FULFILLED: (state, action: Action<GetMetadataReturn>) => ({
				...state,
				data: { ...state.data, ...action.payload },
			}),

			SETUP_SHOW_NFT_ID: (state, action: Action<string>) => ({
				...state,
				show: action.payload,
			}),
		},
		defaultState,
	),
};
