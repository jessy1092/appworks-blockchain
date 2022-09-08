import { combineReducers } from 'redux';

import * as routing from './routing';

// For Global State interface
export interface State {
	routing: routing.State;
}

export const defaultState: State = {
	routing: routing.defaultState,
};

const reducers = combineReducers<State>({
	...routing.reducer,
});

export default reducers;
