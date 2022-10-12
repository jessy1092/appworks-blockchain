import { combineReducers } from 'redux';

import * as routing from './routing';
import * as metadata from './metadata';

// For Global State interface
export interface State {
	routing: routing.State;
	metadata: metadata.State;
}

export const defaultState: State = {
	routing: routing.defaultState,
	metadata: metadata.defaultState,
};

const reducers = combineReducers<State>({
	...routing.reducer,
	...metadata.reducer,
});

export default reducers;
