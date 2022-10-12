import { setupShowNFTId } from 'models/metadata';
import React from 'react';

import { CustomRoute } from 'routes/hook';

const routes: CustomRoute = {
	path: '/gallery',
	components: () => [],
	render: (_, children) => children,
	onEnter: async ({ store }) => {
		console.log('on Enter appworks');
		console.log('on Enter appworks / end');
	},
	children: [
		{
			path: '',
			components: () => [import(/* webpackChunkName: 'gallery' */ './Home')],
			render: ([Gallery]) => <Gallery />,
			onEnter: async ({ store }) => {
				console.log('on Enter gallery home');
				console.log('on Enter gallery home / end');
			},
		},
		{
			path: '/:id',
			components: () => [import(/* webpackChunkName: 'nft' */ './component')],
			render: ([NFT]) => <NFT />,
			onEnter: async ({ store, params }) => {
				console.log('on Enter nft');
				store.dispatch(setupShowNFTId(params.id as string));
				console.log('on Enter nft / end');
			},
		},
	],
};
export default routes;
