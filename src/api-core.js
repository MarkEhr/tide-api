//Vendor imports
import qs from 'qs';
import urljoin from 'url-join';

//Local imports
import {
    ACTION_PREFIX,
    LOGIN_STATE,
    ACTION_LOG,
    STATE_ACTION_APPEND,
    STATE_ACTION_CLEAR,
    STATE_ACTION_SEARCH_N_DELETE,
    STATE_ACTION_SEARCH_N_REPLACE,
    STATE_ACTION_SET,
    QUEUED_RESPONSE, ACTION_SET_STATE, LOGIN_LOADING_ID,
} from "./constants_api";

import { APP_LOADING_END, APP_LOADING_START} from "./actions/types";
import CacheManager from './utils/CacheManager';
import QueueManager from "./utils/QueueManager";
import LocalStorageState from "./utils/LocalStorageState";

//Default initialization parameters
const defaultConfig = {

    commonPath : '',
    createHeaders: function(apiCallOptions){
        let headers= {"Accept": "application/json" };

        if( this.token )
            headers["Authorization"] = "Bearer "+this.token;
        if(!apiCallOptions.useFormData)
            headers["Content-Type"]= "application/json";
        return headers;
    },
    credentials: 'omit',
    getDataFromResponse: ( resp )=>resp,
    getMetaDataFromResponse: ()=>undefined,
    localStorageKey: 'tideApi',
    login: {
        path: 'login_check',
        method: 'POST',
        useCommonPath: true,
        createBody: ( username, password )=>{
            let credentials = new FormData();
            credentials.append("_username", username );
            credentials.append("_password", password);
            return credentials;
        },
        parseJson: true,
        tokenExtractor: ( json )=>json.token
    },

    logout: {
        path: 'logout',
        useCommonPath: false
    },

    nameToPath:  str =>str.split(/(?=[A-Z])/).join('_').toLowerCase(),
    parseJson: true,
    queryStringOptions: { arrayFormat: 'brackets' }, // See https://github.com/ljharb/qs#stringifying for available options
    queueInterval: 180000,// 3 minutes
    reduxStore: undefined,
    saveTokenToLocalStorage: false,
    strictMode: true,
    tokenKey: 'tideApiToken',

};

export default class Api {

    constructor( config )
    {

        this.config = { ...defaultConfig, ...config };
        if( config && config.login )
            this.config.login = {...defaultConfig.login, ...config.login};

        if( !this.config.host )
            throw( new Error("Missing required parameter 'host' to initialize API") );
        this.host = config.host;

        this.store = this.config.reduxStore;

        if( this.config.saveTokenToLocalStorage === 'safari' && !navigator.userAgent.match(/Version\/[\d.]+.*Safari/) )
            this.config.saveTokenToLocalStorage = false;

        if( this.config.saveTokenToLocalStorage && window.localStorage && window.localStorage[ this.config.tokenKey ] )
            this.token = window.localStorage[ this.config.tokenKey ];

        this.cacheManager = new CacheManager( config.tokenKey );

        this.queueManager = new QueueManager( this, config.localStorageKey, config.queueInterval );


        if( window.navigator.serviceWorker ) {
            window.navigator.serviceWorker.addEventListener('message', event => {
                if (event.data === 'refresh')
                    window.location.reload();
            });
        }

        const initialState = Api.getInitialState(this.config.localStorageKey);

        if(initialState && this.store)
            this.store.dispatch({
                type: ACTION_PREFIX + ACTION_SET_STATE,
                payload: {
                    state: initialState,
                }
            });

        return new Proxy( this, { get: this.getProperty } );
    }

    /**
     * Proxy method to mock each endpoint as if it were a property of the "api" object
     *
     * @param api The api object
     * @param field The requested field, when someone try to access "api.users" this would be "users"
     **/
    getProperty=( api, field )=>{

        if (field in api) return api[field]; // normal case

        for( const index in this.config.endpoints ){

            const endpoint = this.config.endpoints[ index ];
            if(  typeof endpoint === "string" && endpoint === field )
                return this.handleEndpointCall( endpoint );

            else if( typeof endpoint === "object" && endpoint.name === field )
                return this.handleEndpointCall( endpoint );

        }

        //The field was not defined, in strictMode we throw an exception otherwise create an endpoint from the field
        if( api.config.strictMode )
            return undefined;
            //throw ("Endpoint '" + field + "' not defined in API");
        else
            return this.handleEndpointCall( field );
    };

    static getInitialState( localStorageKey = 'tideApi' ){

        const storage = new LocalStorageState( localStorageKey );
        const oldState = storage.getState();

        if( oldState )
            return oldState;
        else
            return {};
    }

    login()
    {
        const url = urljoin(
            this.host,
            this.config.login.useCommonPath? this.config.commonPath :'',
            this.config.login.path
        );

        if( this.store )
            this.store.dispatch({ type:APP_LOADING_START, payload: {id:LOGIN_LOADING_ID} });

        const loginError = (response)=>{

            const newState = response && response.status === 401? LOGIN_STATE.BAD_CREDENTIALS : LOGIN_STATE.LOGIN_ERROR;
            if (this.store) {

                this.store.dispatch({
                    type: ACTION_PREFIX + ACTION_LOG,
                    payload: {
                        state: newState,
                        storageKey: this.config.localStorageKey
                    }
                });
                this.store.dispatch({type: APP_LOADING_END, payload: {id:LOGIN_LOADING_ID}});
            }

            let loginError;
            if(response instanceof Error)
                loginError = response;
            else {
                loginError = new Error(newState);
                loginError.response = response;
            }
            throw loginError;
        };

        const loginSuccess = (response)=>{

            if( response.status >= 400 )
                return loginError(response);

            if( response.status !== 200 )
                return response;

            //response.status === 200
            const finishLogin = (response)=>{

                let token;
                if(this.config.login && this.config.login.tokenExtractor)
                    token = this.config.login.tokenExtractor.call(this, response);

                this.setLoggedIn(token);

                return response;
            };

            if( this.config.login && this.config.login.parseJson )
                return response.json().then(finishLogin);
            else
                return finishLogin(response);

        };

        return fetch(
            url,
            {
                method: this.config.login.method,
                body: this.config.login.createBody.call(this, ...arguments),
                credentials: this.config.credentials
            })
            .then(loginSuccess, loginError);

    };

    setLoggedIn = (token)=>{

        this.token = token;

        if( this.config.saveTokenToLocalStorage && this.token && window.localStorage)
            window.localStorage[this.config.tokenKey] = this.token;

        if( this.store ) {
            this.store.dispatch({
                type: ACTION_PREFIX + ACTION_LOG,
                payload: {
                    state: LOGIN_STATE.LOGGED_IN,
                    storageKey: this.config.localStorageKey
                }
            });
            this.store.dispatch({type: APP_LOADING_END, payload: {id:LOGIN_LOADING_ID}});
        }
    };

    logout = ()=>
    {

        const done = ( response )=> {

            if( this.store ) {
                this.store.dispatch({
                    type: ACTION_PREFIX + ACTION_LOG,
                    payload: {
                        state: LOGIN_STATE.NOT_LOGGED,
                        storageKey: this.config.localStorageKey
                    }
                });
                this.store.dispatch({
                    type: STATE_ACTION_CLEAR
                })
            }

            if( this.config.saveTokenToLocalStorage && this.token && window.localStorage)
                delete window.localStorage[this.config.tokenKey];

            if( this.config.parseJson &&
                response &&
                response.headers &&
                response.headers.get("Content-Type") &&
                response.headers.get("Content-Type").split(";")[0] === "application/json" )

                return response.json();

            return response;
        };

        const url =  urljoin( this.host, this.config.useCommonPath? this.config.commonPath:'', this.config.logout.path );
        return fetch( url,{credentials: 'include'}).then(done,done);
    };

    handleEndpointCall( endpoint, endpointConfig ){

        const endType = typeof endpoint;

        if( endType !== "object" && endType !== "string" )
            throw ("Endpoint definition should be an object or a string, got " + endType);

        if( endType === 'string' )
            return {
                create: this.createCreateMethod( endpoint, endpointConfig ),
                get: this.createGetMethod( endpoint, endpointConfig ),
                update: this.createUpdateMethod( endpoint, endpointConfig ),
                delete: this.createDeleteMethod( endpoint, endpointConfig ),
            };

        //Endpoint is an object

        if( !endpoint.name || typeof endpoint.name !== "string" )
            throw ("An endpoint definition of type object must have a \"name\" property of type string");

        let endpointObject = endpoint.preventDefaultMethods? {}: this.handleEndpointCall( endpoint.name, endpoint );

        if( endpoint.customMethods ) {
            let methods = {};
            const that = this;
            for( let name in endpoint.customMethods)
                methods[name] = (...args)=>endpoint.customMethods[name].call(that, ...args);

            endpointObject = {...endpointObject, ...methods};
        }

        return endpointObject;

    }

    createGetMethod( endpoint, endpointConfig ){

        const _this = this;

        if( typeof endpoint === 'string' )
            return function( config = {} ){
                const {params, customProp, ..._config} = config;
                return _this.apiCall(  _this.config.nameToPath.call(this, endpoint ), customProp || endpoint, params, {...endpointConfig, ..._config} )
            }

    }

    createCreateMethod( endpoint ){

        const _this = this;
        const defaultPostConfig = {
            method:'POST',
            stateAction:STATE_ACTION_APPEND
        };

        if( typeof endpoint === 'string' )
            return function( config = {} ){
                const {params, files, customProp, ..._config} = config;
                return _this.apiCall(  _this.config.nameToPath( endpoint ), customProp || endpoint, params, {..._config, ...defaultPostConfig}, files )
            }

    }

    createUpdateMethod( endpoint ){

        const _this = this;
        const defaultPostConfig = {
            method:'PUT',
            stateAction:STATE_ACTION_SEARCH_N_REPLACE
        };

        if( typeof endpoint === 'string' )
            return function( config = {} ){
                const objectId = config.id;

                if( !objectId )
                    throw (new Error("The update endpoint requires an id to be sent in the config object"));

                const {params, files, customProp, ..._config} = config;
                return _this.apiCall(  urljoin(_this.config.nameToPath( endpoint ), String(objectId) ) , customProp || endpoint, params, {..._config, ...defaultPostConfig}, files )
            }

    }

    createDeleteMethod( endpoint ){

        const _this = this;
        const defaultPostConfig = {
            method:'DELETE',
            stateAction:STATE_ACTION_SEARCH_N_DELETE
        };

        if( typeof endpoint === 'string' )
            return function( config = {} ){

                const objectId = config.id;

                if( !objectId )
                    throw (new Error("The delete endpoint requires an id to be sent in the config object"));

                const {params, files, customProp, ..._config} = config;
                return _this.apiCall(   urljoin(_this.config.nameToPath( endpoint ), String(objectId)), customProp || endpoint, params||{id:objectId}, {..._config, ...defaultPostConfig}, files )
            }

    }

    apiCall = ( path, property, params, config, files)=>
    {
        const apiCallOptions = {path, property, params, config, files};

        if( !config )
            config = {...this.config};
        else
            config={...this.config,...config};

        let method = config.method || "GET";
        const stateAction = config.stateAction || STATE_ACTION_SET;
        let useFormData = config.useFormData || false;
        if( files )
            useFormData = true;

        // Prepare request
        let query = "?";
        let body = undefined;

        if( params || files ) {

            if (method === "GET" ) {
                query += qs.stringify(params, this.config.queryStringOptions );
            }
            else if ( useFormData ){
                const form_data = new FormData();
                form_data.append("_method",method);
                if(params)
                    form_data.append("data",JSON.stringify(params));
                if( files && files.constructor === File ) {
                    if (files.name)
                        form_data.append("file", files, files.name);
                    else
                        form_data.append("file", files);
                }
                else if( files && files.constructor === Array ) {
                    files.forEach((file) => {
                        if( file ) {
                            if (file.name)
                                form_data.append("files[]", file, file.name);
                            else
                                form_data.append("files[]", file);
                        }
                    });
                }
                else if(files && typeof files === "object"){
                    for( const name in files ) {
                        if( typeof files[name] === 'object' && files[name].constructor === File )
                            form_data.append(name, files[name]);
                    }
                }


                method = "POST";
                body = form_data;
            }
            else if( method === "POST" || method === "PUT" ){
                body = JSON.stringify(params);
            }

        }

        //Make request
        let loadingStartAction = {type:APP_LOADING_START};
        if( config.loadingId ) loadingStartAction.payload = {id:config.loadingId};

        if( this.store )
            this.store.dispatch(loadingStartAction);

        let responseHeaders;

        const successHandler = ( data )=>{

            let loadingEndAction = {type:APP_LOADING_END};
            if( config.loadingId ) loadingEndAction.payload = {id:config.loadingId};

            if( data === QUEUED_RESPONSE ) {
                if( this.store )
                    this.store.dispatch(loadingEndAction);
                return data;
            }

            if( !data )
                return errorHandler("Empty response");

            const extractedData = this.config.getDataFromResponse.call(this, data, responseHeaders);

            if( this.store ) {

                this.store.dispatch({

                    type: ACTION_PREFIX + stateAction,
                    payload: {
                        success: true,
                        method,
                        property,
                        params,
                        data: extractedData,
                        meta: this.config.getMetaDataFromResponse.call(this, data, responseHeaders )
                    }

                });

                this.store.dispatch(loadingEndAction);
            }

            if( config.cacheable )
                this.cacheManager.saveToCache( data, path, params );

            return extractedData;
        };

        const errorHandler = ( response )=>{

            let loadingEndAction = {type:APP_LOADING_END};

            if( config.loadingId )
                loadingEndAction.payload = {id:config.loadingId};

            if( this.store )
                this.store.dispatch(loadingEndAction);

            if( response && response.status === 401 )
                return;

            if( response && response.headers &&
                response.headers.get("Content-Type") && (
                    response.headers.get("Content-Type").split(";")[0] === "application/problem+json" ||
                    response.headers.get("Content-Type").split(";")[0] === "application/json" )
            ){
                return response.json().then((json)=>{
                    if(config.onError)
                        config.onError.call(this, json);
                    throw( json );
                })
            }
            else{
                //TODO: Handle error
                if(config.onError)
                    config.onError.call(this, response);
            }

            throw( response );

        };

        const requestFinished = (response)=>{

            if( !response.status ) {//Inside this if means the fetch failed

                if( config.cacheable ) {//If it was a cacheable request, look for it in the cache and return it as if nothing has happened
                    const cached = this.cacheManager.searchCache(path, params );

                    if (cached)
                        return cached;
                }

                if( config.queueable ){//If it was a queueable request, save it to the queue to try again later.

                    //console.log('Request to ' + path + ' queued.');
                    const item = this.queueManager.createQueueItem( path, property, params, config, files );
                    this.queueManager.push( item );

                    return QUEUED_RESPONSE;
                }

                throw(response);
            }

            if( response && response.headers ) {
                responseHeaders = response.headers;
            }

            if (response.status === 401) {

                if (this.store) {
                    this.store.dispatch({
                        type: ACTION_PREFIX + ACTION_LOG,
                        payload: {
                            state: LOGIN_STATE.NOT_LOGGED,
                            storageKey: this.config.localStorageKey
                        }

                    });
                }

                return Promise.reject(response);
            }
            else if (response.status >= 400) {

                return Promise.reject(response);
            }
            else if( response.status === 204 ){
                return response;
            }
            else if(
                config.parseJson &&
                response.json &&
                response.headers.get("Content-Type").split(";")[0] === "application/json"
            )
                return response.json();

            return response;
        };

        const headers = config.createHeaders.call(this, {...apiCallOptions, useFormData});

        if(config.appendHeaders)
            config.appendHeaders.call(this, headers, apiCallOptions);

        const url = urljoin( this.host, config.useCommonPath===false?'':config.commonPath, path, query);

        return fetch(
            url,
            {
                credentials: config.credentials,
                headers,
                method,
                body
            })
        //Get response
            .then(requestFinished,requestFinished)
            .then( successHandler, errorHandler );

    };

    clearProperty = (property)=>
    {
        if( this.store )
            this.store.dispatch({
                type: ACTION_PREFIX+STATE_ACTION_CLEAR,
                payload: {property}
            })
    };

}
