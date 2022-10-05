import React from 'react';

import { CustomRoute } from 'routes/hook';

export const sleep = (time: number): Promise<undefined> =>
	new Promise(resolve => setTimeout(resolve, time));

const routes: CustomRoute = {
	path: '/test-erc4626',
	components: () => [import(/* webpackChunkName: 'test-erc4626' */ './component')],
	render: ([Vault]) => <Vault />,
	onEnter: async ({ store }) => {
		console.log('on Enter test-erc4626');
		console.log('on Enter test-erc4626 / end');
	},
};
export default routes;
