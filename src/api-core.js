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
    STATE_ACTION_SET_SINGLE,
    QUEUED_RESPONSE,
} from "./constants_api";

import { APP_LOADING_END, APP_LOADING_START} from "./actions/types";
import CacheManager from './utils/CacheManager';
import QueueManager from "./utils/QueueManager";
import LocalStorageState from "./utils/LocalStorageState";

//Default initialization parameters
const defaultConfig = {
    localStorageKey: 'api',
    path : '',
    queryStringOptions: { arrayFormat: 'brackets' }, // See https://github.com/ljharb/qs#stringifying for available options
    queueInterval: 180000,// 3 minutes
    saveTokenToLocalStorage: false,
    tokenKey: 'googlead',

    login: {
        path: 'login_check',
        method: 'POST',
        createBody: ( [username, password] )=>{
            let credentials = new FormData();
            credentials.append("_username", username );
            credentials.append("_password", password);
            return credentials;
        }
    },

    logout: {
        path: 'logout'
    }
};

export default class Api {

    constructor( config )
    {

        this.config = { ...defaultConfig, ...config };

        if( !this.config.host )
            throw( "Missing required parameter 'host' to initialize API" );
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

        return new Proxy( this, { get: this.getProperty } );
    }

    getProperty =  ( api, field )=>{

        if (field in api) return api[field]; // normal case

        for( const index in this.config.endpoints ){

            const endpoint = this.config.endpoints[ index ];
            if(  typeof endpoint === "string" && endpoint === field )
                return this.handleEndpointCall( endpoint );

            else if( typeof endpoint === "object" && endpoint.name === field )
                return this.handleEndpointCall( endpoint );

        }

        throw ("Endpoint '" + field + "' not defined in API");
    };

    getInitialState(){

        const storage = new LocalStorageState( this.config.localStorageKey );
        const oldState = storage.getState();

        if( oldState )
            return oldState;
        else
            return {};
    }

    createUrl( resourcePath ){
        return urljoin( this.host, this.config.path, resourcePath );
    };

    login()
    {
        const url = this.createUrl( this.config.login.path );

        if( this.store )
            this.store.dispatch({ type:APP_LOADING_START });

        fetch(
            url,
            {
                method: this.config.login.method,
                body: this.config.login.createBody( arguments ),
                credentials: 'include'
            })
            .then(( response)=>{

                if( response.status === 200 ){

                    if( this.config.saveTokenToLocalStorage ){

                        response.json().then((json)=>{

                            this.token = json.token;
                            if( window.localStorage ) window.localStorage[ this.config.tokenKey ] = this.token;

                            if( this.store ) {
                                this.store.dispatch({
                                    type: ACTION_PREFIX + ACTION_LOG,
                                    payload: {
                                        state: LOGIN_STATE.LOGGED_IN,
                                        storageKey: this.config.localStorageKey
                                    }
                                });
                                this.store.dispatch({type: APP_LOADING_END});
                            }
                        })

                    }
                    else if( this.store ){
                        this.store.dispatch({
                            type: ACTION_PREFIX + ACTION_LOG,
                            payload: {
                                state: LOGIN_STATE.LOGGED_IN,
                                storageKey: this.config.localStorageKey
                            }
                        });
                        this.store.dispatch({type: APP_LOADING_END});
                    }
                }
                else if( response.status === 401 ){
                    if( this.store ) {
                        this.store.dispatch({
                            type: ACTION_PREFIX + ACTION_LOG,
                            payload: {
                                state: LOGIN_STATE.BAD_CREDENTIALS,
                                storageKey: this.config.localStorageKey
                            }
                        });
                        this.store.dispatch({type: APP_LOADING_END});
                    }
                }
                else {
                    loginError();
                }

                return response;
            }, loginError);

        const that= this;
        function loginError() {

            if (that.store) {

                that.store.dispatch({
                    type: ACTION_PREFIX + ACTION_LOG,
                    payload: {
                        state: LOGIN_STATE.BAD_CREDENTIALS,
                        storageKey: that.config.localStorageKey
                    }
                });
                that.store.dispatch({type: APP_LOADING_END});
            }
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
            return response;
        };

        const url = this.createUrl( this.config.logout.path );
        fetch( url,{credentials: 'include'}).then(done,done);
    };

    /*
    lounges =
        {
            get: ( loadingId, filters, property )=> this.apiCall(ApiPaths.lounges, property?property:"lounges", {itemsPerPage:200, ...filters}, {loadingId, cacheable:true} ),
            create: ( name, isWarehouse, property )=> this.apiCall( ApiPaths.lounges, property?property:"lounges", {name, isWarehouse}, {method:"POST", stateAction:STATE_ACTION_APPEND} ),
            edit: ( id, name, property )=> this.apiCall( `${ApiPaths.lounges}/${id}`, property?property:"lounges", {id, name}, {method:"PUT", stateAction:STATE_ACTION_SEARCH_N_REPLACE} ),
            delete: ( id, property )=> this.apiCall( `${ApiPaths.lounges}/${id}`, property?property:"lounges", {id}, {method:"DELETE", stateAction:STATE_ACTION_SEARCH_N_DELETE} )
        };
*/
    handleEndpointCall( endpoint ){

        if( typeof endpoint === 'string' )
            return {
                create: function(){ console.log('create user') }
            }
    }

    apiCall = ( path, property, params, config, files)=>
    {

        if( !config )
            config = {};
        let method = config.method || "GET";
        const stateAction = config.stateAction || STATE_ACTION_SET;
        let useFormData = config.useFormData || false;
        if( files )
            useFormData = true;

        // Prepare request
        let query = "?";
        let body = undefined;

        if( params ) {

            if (method === "GET" ) {
                query += qs.stringify(params, this.config.queryStringOptions );
            }
            else if ( useFormData ){
                const form_data = new FormData();
                form_data.append("_method",method);
                form_data.append("data",JSON.stringify(params));
                if( files && files.constructor === Array ) {
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

            if( this.store ) {

                this.store.dispatch({

                    type: ACTION_PREFIX + stateAction,
                    payload: {
                        success: true,
                        method,
                        property,
                        params,
                        ...data
                    }

                });

                this.store.dispatch(loadingEndAction);
            }

            if( config.cacheable )
                this.cacheManager.saveToCache( data, path, params );

            return data.data;
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
                    //TODO: Handle json error
                    throw( json );
                })
            }
            else{
                //TODO: Handle error
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

            if( response && response.headers )
                this.responseHeadersHandler( response.headers );

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
            else if(response.json){
                return response.json()
            }

        };

        let headers= {"Accept": "application/json" };

        if( this.config.saveTokenToLocalStorage && this.token )
            headers["Authorization"] = "Bearer "+this.token;
        if(! useFormData )
            headers["Content-Type"]= "application/json";
        if( window.localStorage.switchMe )
            headers["x-view-analytics"]= window.localStorage.switchMe;

        if( window.debugAPI )
            console.log( 'API CALL', { path, method, headers, query, body } );

        return fetch(
            this.host + path + query,
            {
                credentials: 'include',
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

    responseHeadersHandler = ( headers )=>{

        if( headers.get("X-App-Version") )
            this.handleVersionHeader(headers.get("X-App-Version") );

        //if( process.env.REACT_APP_BUILD === 'prod' )
        //    this.turnOnWebDebugger();

    };

    handleVersionHeader = ( versionHeader )=>{

        if( typeof  versionHeader !== 'string' )
            return;

        const size = versionHeader.length;
        let forceReload = false;

        if( versionHeader[ size-1 ] === 'f' ) {
            forceReload = true;
            versionHeader = versionHeader.slice( 0, size-1 );
        }

        if( versionHeader === version )
            return;

        const headerParts = versionHeader.split('.');
        const appParts = version.split('.');

        if( Number(headerParts[0]) > Number(appParts[0]) )
            return this.handleNewerVersion( versionHeader, forceReload );

        if( Number(headerParts[0]) < Number(appParts[0]) )
            return;

        if( Number(headerParts[1]) > Number(appParts[1]) )
            return this.handleNewerVersion( versionHeader, forceReload );

        if( Number(headerParts[1]) < Number(appParts[1]) )
            return;

        if( Number(headerParts[2]) > Number(appParts[2]) )
            return this.handleNewerVersion( versionHeader, forceReload );

    };

    handleNewerVersion = ( version, force)=>{


        console.log("Newer version detected");

        /*
        if( !this.newerVersion && window.swRegistration )
            window.swRegistration.update()
                .then(()=>{
                    //This will broadcast the refresh message to all active tabs of the app through the sw
                    if( force )
                        window.navigator.serviceWorker.controller.postMessage('force_refresh');
                });
                */

        this.newerVersion = version;
        if( force && !window.swRegistration )
            window.location.reload(  );
    };

}
