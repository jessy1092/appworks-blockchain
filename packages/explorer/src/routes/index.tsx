import React from 'react';

import { CustomRoute } from './hook';

import TestERC4626Route from './Test-ERC4626';
import AppworksRoute from './Appworks';

const childrenHomeRoute: CustomRoute = {
	path: '',
	components: () => [import(/* webpackChunkName: 'home' */ './Home')],
	render: ([Home]) => <Home />,
	onEnter: async ({ next }) => {
		console.log('on Enter Home');
		const children = await next();
		console.log('on Enter Home / end');
		return children;
	},
};

const routes: CustomRoute = {
	path: '/',
	components: () => [],
	render: (_, children) => children,
	onEnter: async ({ next }) => {
		console.log('on Enter Root');
		const children = await next();
		console.log('on Enter Root / end');

		return children;
	},
	children: [childrenHomeRoute, TestERC4626Route, AppworksRoute],
};

export default routes;
