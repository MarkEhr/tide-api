import apiCore from './api-core';
import {
    ACTION_PREFIX, STATE_ACTION_SET, STATE_ACTION_APPEND,
    STATE_ACTION_PREPEND, STATE_ACTION_SEARCH_N_DELETE,
    STATE_ACTION_SEARCH_N_REPLACE, STATE_ACTION_SET_SINGLE,
    STATE_ACTION_CLEAR, STATE_ACTION_CONCAT, STATE_ACTION_PRE_CONCAT
}
    from "./constants_api";

export {default as reducer} from './reducers/reducer_api';
export {default as loadingReducer} from './reducers/reducer_loading';
export {default as loadingByIdReducer} from './reducers/reducer_loading_by_id';
export { LOGIN_STATE, LOGIN_LOADING_ID } from "./constants_api";
export const STATE_ACTIONS = {
    ACTION_PREFIX, STATE_ACTION_SET,
    STATE_ACTION_APPEND,
    STATE_ACTION_PREPEND,
    STATE_ACTION_SEARCH_N_DELETE,
    STATE_ACTION_SEARCH_N_REPLACE,
    STATE_ACTION_SET_SINGLE,
    STATE_ACTION_CLEAR, STATE_ACTION_CONCAT, STATE_ACTION_PRE_CONCAT
};

export default  apiCore;
