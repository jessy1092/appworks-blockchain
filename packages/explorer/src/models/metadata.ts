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

// export const getMetadata = createAction<GetMetadataReturn, number[]>('GET_METADATA', async ids => {
// 	return {};
// });

export const getBlindMetadata = createAction<Promise<GetMetadataReturn>>(
	'GET_METADATA',
	async () => {
		const result = await fetch(
			'https://pub-a643c8f17c284976bce3b03942a4ef02.r2.dev/metadata/blind',
		);

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
