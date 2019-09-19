import {APP_LOADING_START, APP_LOADING_END, CLEAR_STATE} from "../actions/types";

const defaultState = 0;
export default function( state=defaultState, action){

    switch( action.type ){

        case APP_LOADING_START:
            return state + 1;
        case APP_LOADING_END:
            return state > 0? state - 1 : 0;
        case CLEAR_STATE:
            return defaultState;
        default:
            return state;
    }
}
