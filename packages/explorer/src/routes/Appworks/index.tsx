import React from 'react';

import { CustomRoute } from 'routes/hook';

import GalleryRoute from './Gallery';

const routes: CustomRoute = {
	path: '/appworks',
	components: () => [],
	render: (_, children) => children,
	onEnter: async ({ store }) => {
		console.log('on Enter appworks');
		console.log('on Enter appworks / end');
	},

	children: [
		{
			path: '',
			components: () => [import(/* webpackChunkName: 'appworks' */ './component')],
			render: ([AppWroks]) => <AppWroks />,
			onEnter: async ({ store }) => {
				console.log('on Enter appworks home');
				console.log('on Enter appworks home / end');
			},
		},
		GalleryRoute,
	],
};
export default routes;
