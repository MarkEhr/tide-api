import reducer_api from '../reducers/reducer_api';
import loadingReducer from '../reducers/reducer_loading';
import loadingByIdReducer from '../reducers/reducer_loading_by_id';
import { ACTION_PREFIX, ACTION_LOG, ACTION_SET_STATE, STATE_ACTION_CLEAR } from '../constants_api';
import { APP_LOADING_START, APP_LOADING_END } from '../actions/types';

export default class SimpleAdapter {
    constructor(initialState){
        this.state = initialState || {
            api: reducer_api(undefined, {type: '@@INIT'}),
            loading: loadingReducer(undefined, {type: '@@INIT'}),
            loadingIds: loadingByIdReducer(undefined, {type: '@@INIT'})
        };
    }

    getState(){
        return this.state;
    }

    dispatch(action){
        this.state = {
            api: reducer_api(this.state.api, action),
            loading: loadingReducer(this.state.loading, action),
            loadingIds: loadingByIdReducer(this.state.loadingIds, action)
        };
    }

    initializeState(state){
        this.dispatch({ type: ACTION_PREFIX + ACTION_SET_STATE, payload: { state } });
    }

    startLoading(id){
        const action = { type: APP_LOADING_START };
        if(id) action.payload = { id };
        this.dispatch(action);
    }

    endLoading(id){
        const action = { type: APP_LOADING_END };
        if(id) action.payload = { id };
        this.dispatch(action);
    }

    updateData(stateAction, payload){
        this.dispatch({ type: ACTION_PREFIX + stateAction, payload });
    }

    log(state, storageKey, useSessionStorage){
        this.dispatch({ type: ACTION_PREFIX + ACTION_LOG, payload: { state, storageKey, useSessionStorage } });
    }

    clearProperty(property){
        this.dispatch({ type: ACTION_PREFIX + STATE_ACTION_CLEAR, payload: { property } });
    }

    clearState(){
        this.dispatch({ type: STATE_ACTION_CLEAR });
    }
}
