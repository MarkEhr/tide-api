
//Actions prefix
export const ACTION_PREFIX = "@API_";

//Actions suffixes
export const ACTION_LOG = "LOG_APP";
export const ACTION_SET_STATE = "SET_STATE";//Set the whole state of the api in redux

//This actions say how to save the obtained data to the store
export const STATE_ACTION_APPEND = "APPEND";//Append to an array of items
export const STATE_ACTION_PREPEND = "PREPEND";//Append to an array of items
export const STATE_ACTION_SET = "SET";//Set the data in the response as the object in the state
export const STATE_ACTION_SET_SINGLE = "SET_SINGLE";//Set the data in the response inside the state object with id as key
export const STATE_ACTION_SEARCH_N_DELETE = "SEARCH_N_DELETE";//Search the object in an array in the store and remove it
export const STATE_ACTION_SEARCH_N_REPLACE = "SEARCH_N_REPLACE";//Search the object in an array in the store and replace it with the one in the response
export const STATE_ACTION_CLEAR = "CLEAR";//Set corresponding state piece to undefined


export const QUEUED_RESPONSE = 'QUEUED_RESPONSE';//This is returned by a failed request which was queued to be sent later

//States
export const LOGIN_STATE = {
    NOT_LOGGED: "NOT_LOGGED",
    LOGGED_IN: "LOGGED_IN",
    BAD_CREDENTIALS: "BAD_CREDENTIALS",
    LOGIN_ERROR: "LOGIN_ERROR",
};

export const LOGIN_LOADING_ID='@tide-api.login';

export const initialState = {
    loggedIn: LOGIN_STATE.NOT_LOGGED,
};
