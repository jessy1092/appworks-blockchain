import React from 'react';

import { CustomRoute } from 'routes/hook';

export const sleep = (time: number): Promise<undefined> =>
	new Promise(resolve => setTimeout(resolve, time));

const routes: CustomRoute = {
	path: '/appworks',
	components: () => [import(/* webpackChunkName: 'members' */ './component')],
	render: ([Vault]) => <Vault />,
	onEnter: async ({ store }) => {
		console.log('on Enter appworks');
		console.log('on Enter appworks / end');
	},
};
export default routes;
