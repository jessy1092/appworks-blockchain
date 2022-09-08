/* eslint-disable import/no-import-module-exports */
/* eslint-disable @typescript-eslint/no-var-requires */

/// <reference path="../../types/redux-thunk-fsa.d.ts" />
import { createStore, applyMiddleware, compose, Store } from 'redux';

import promiseMiddleware from 'redux-promise-middleware';
import thunkMiddleware from 'redux-thunk-fsa';

import reducers, { State } from 'models/reducers';

const middlewares = [thunkMiddleware, promiseMiddleware];
let composeEnhancers = compose;

if (process.env.NODE_ENV !== 'production') {
	composeEnhancers = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export default function configureStore(preState: State): Store {
	const store = createStore(reducers, preState, composeEnhancers(applyMiddleware(...middlewares)));
	return store;
}
