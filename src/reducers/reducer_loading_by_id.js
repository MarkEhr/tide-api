import {APP_LOADING_START, APP_LOADING_END, CLEAR_STATE} from "../actions/types";

const defaultState = {};
export default function( state=defaultState, action){

    switch( action.type ){

        case APP_LOADING_START:
            if( action.payload && action.payload.id ){
                const oldCount = state && state[action.payload.id]? state[action.payload.id]:0;
                return {...state, [action.payload.id]: oldCount+1};
            }
            else
                return state;
        case APP_LOADING_END:
            if( action.payload && action.payload.id ){
                const oldCount = state && state[action.payload.id]? state[action.payload.id]:1;
                return {...state, [action.payload.id]: oldCount-1};
            }
            else
                return state;
        case CLEAR_STATE:
            return defaultState;
        default:
            return state;
    }
}
