
import dataReducer from './reducer_data';
import {ACTION_PREFIX, initialState, ACTION_LOG, LOGIN_STATE, STATE_ACTION_CLEAR} from "../constants_api";

import LocalStorageState from "../utils/LocalStorageState";

export default function( state=initialState, action){

    if( action.type === STATE_ACTION_CLEAR)
        return initialState;

    if( action.type.substr(0,ACTION_PREFIX.length) !== ACTION_PREFIX )
        return state;

    const apiAction = action.type.substr(ACTION_PREFIX.length);

    if (apiAction === ACTION_LOG) {

        if( action.payload.state === LOGIN_STATE.LOGGED_IN || action.payload.state === LOGIN_STATE.NOT_LOGGED ) {
            let loc = new LocalStorageState( action.payload.storageKey );
            loc.store({api: {loggedIn: action.payload.state }});
        }
        return {...state, loggedIn: action.payload.state };
    } else {

        return dataReducer(state, action);
    }
}