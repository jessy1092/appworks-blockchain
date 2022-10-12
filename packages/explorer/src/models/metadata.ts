import { createAction, handleActions } from 'redux-actions';

interface Attributes {
	trait_type: string;
	value: string | number;
	display_type?: string;
}

interface Metadata {
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

export type State = {
	data: {
		[id: string]: Metadata;
	};
};

export const defaultState: State = { data: {} };

export const reducer = {
	metadata: handleActions<State, GetMetadataReturn>(
		{
			GET_METADATA_FULFILLED: (state, action) => ({
				...state,
				data: { ...state.data, ...action.payload },
			}),
		},
		defaultState,
	),
};
