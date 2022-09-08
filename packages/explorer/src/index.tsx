import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';

import 'normalize.css';

import './index.css';

import reportWebVitals from './reportWebVitals';

import Router from 'layouts/Router';

import { defaultState } from 'models/reducers';
import configureStore from 'store';
import history from 'store/history';
import routes from 'routes';

const store = configureStore(defaultState);

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
	<React.StrictMode>
		<Provider store={store}>
			<Router history={history} routes={routes} store={store} />
		</Provider>
	</React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
