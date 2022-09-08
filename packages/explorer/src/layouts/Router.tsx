import React, { Suspense } from 'react';
import { History } from 'history';
import { Store } from 'redux';

import App from 'layouts/App';

import { HistoryContext } from 'models/routing';

import useRouter, { CustomRoute } from 'routes/hook';

const Loading: React.FC = () => <div>Loading...</div>;

interface RouterProperty {
	routes: CustomRoute;
	history: History;
	store: Store;
}

const Router: React.FC<RouterProperty> = ({ routes, history, store }) => {
	const { loading, component } = useRouter(routes, history, store);

	return (
		<HistoryContext.Provider value={history}>
			<App>{loading ? <Loading /> : <Suspense fallback={<Loading />}>{component}</Suspense>}</App>
		</HistoryContext.Provider>
	);
};

export default Router;
