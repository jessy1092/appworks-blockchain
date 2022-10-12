import React from 'react';

import { CustomRoute } from 'routes/hook';

const routes: CustomRoute = {
	path: '/gallery',
	components: () => [import(/* webpackChunkName: 'appworks' */ './component')],
	render: ([Gallery]) => <Gallery />,
	onEnter: async ({ store }) => {
		console.log('on Enter appworks');
		console.log('on Enter appworks / end');
	},
};
export default routes;
