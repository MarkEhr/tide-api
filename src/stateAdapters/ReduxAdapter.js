import { ACTION_PREFIX, ACTION_LOG, ACTION_SET_STATE, STATE_ACTION_CLEAR } from '../constants_api';
import { APP_LOADING_START, APP_LOADING_END } from '../actions/types';

export default class ReduxAdapter {
    constructor(store){
        this.store = store;
    }

    setStore(store){
        this.store = store;
    }

    initializeState(state){
        if(!this.store) return;
        this.store.dispatch({
            type: ACTION_PREFIX + ACTION_SET_STATE,
            payload: { state }
        });
    }

    startLoading(id){
        if(!this.store) return;
        const action = { type: APP_LOADING_START };
        if(id) action.payload = { id };
        this.store.dispatch(action);
    }

    endLoading(id){
        if(!this.store) return;
        const action = { type: APP_LOADING_END };
        if(id) action.payload = { id };
        this.store.dispatch(action);
    }

    updateData(stateAction, payload){
        if(!this.store) return;
        this.store.dispatch({
            type: ACTION_PREFIX + stateAction,
            payload
        });
    }

    log(state, storageKey, useSessionStorage){
        if(!this.store) return;
        this.store.dispatch({
            type: ACTION_PREFIX + ACTION_LOG,
            payload: { state, storageKey, useSessionStorage }
        });
    }

    clearProperty(property){
        if(!this.store) return;
        this.store.dispatch({
            type: ACTION_PREFIX + STATE_ACTION_CLEAR,
            payload: { property }
        });
    }

    clearState(){
        if(!this.store) return;
        this.store.dispatch({ type: STATE_ACTION_CLEAR });
    }
}
