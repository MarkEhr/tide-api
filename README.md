#TIDE API

This is intended to easily consume a rest api in javascript projects.

### Getting started

To start using the library you should create an `api` object with the basic config:

    import API from 'tide-api';
    
    const api = new API( config )
    
    api.{endpointname}.get(); //Promise
    
### Config parameters

The configuration should be an object which could contain the following properties:

| Property         |type       |    Default    | Description |
|------------------|-----------|---------------|-------------|
|endpoints (required)|array      | -             |An array describing each endpoint, see next section for endpoints' properties
|host (required)   |string     | -             |The url to which the  request will be done. It should contain the protocol.
|localStorageKey   |string     | "api"         | The key to use in the local storage to save log-in state and cache data
|path              |string     | empty string  |The path to append to the `host` on each request. It could be already appended to the `host` property if you don't intend to overwrite it in any endpoint.
|queryStringOptions|object     | { arrayFormat: 'brackets' } | Options for converting the request parameters to a GET query string. See [qs](https://github.com/ljharb/qs#stringifying) for available options.
|queueInterval     |integer    | 180000        | Time in miliseconds between each try to resend a request when it is queued
|reduxStore        |object     | undefined     |The redux store to dispatch endpoints actions. See [Redux](#Redux) to know how to use it
|saveTokenToLocalStorage|boolean&#124;"safari" | false | Wether to save the authentication token to local storage or not. See [Why to do that](#Authentication tokens and local storage).
|tokenKey          |string     | "googlead"    | The key to use in the local storage to save the token

### Authentication tokens and local storage

Most servers send their authentication identifier as a cookie. However, newer browsers are starting to prevent cookies from being saved when they are cross-origin. This 
makes us impossible to log in to an API hosted in a different domain than our front-end.

To solve this the server must send the authentication token in the log-in request's body, then we save it and append it to
every request we do afterwards, be it as a header, in the query string or as a header.

If `saveTokenToLocalStorage` is set to `true` the token will be sent as a header to the server like this:    
     
     Authorization: Bearer {token}
 
 TODO: Create a configuration to set how is the token sent, change header format or append it to other request part.
 
 
 ### Redux
 
 There's a default integration with redux which can be activated just passing the store to the constructor with the `reduxStore` property.
 
 If you want to use redux, you need to include the api's reducer in to your store's root reducer. Here's an example:
 
     //rootReducer.js
     import { combineReducers } from 'redux';
     import {reducer, loadingReducer, loadingByIDReducer } from 'tide-api';
     
     const rootReducer = combineReducers({
     
         api: reducer
         loading: loadingReducer,
         loadingIds: loadingByIDReducer,
         // ... your other reducers
     });
     
     export default rootReducer;
 
 This would generate three properties in your state:
 - `api`: This is an object where all your endpoints' data will be saved. Each endpoint has its property, let's say you have an `users` endpoint,
 after the promise returned by `api.users.get()` is finished, the state would change and you could find in there the data returned by the server like:
 `state.api.users` That would be an array with the users objects.
 - `loading`: this is an integer with the count of pending requests, this could be used for a global loading indicator. If it's zero, then nothing is loading,
 if it's anything other than zero, then there are some requests pending.
 - `loadingIds`: this is like the loading indicator but for individual endpoint calls. To use this you should send a `loadingId` string to an endpoint call like:    
 `api.users.get( {loadingId:"usersView"} )` after this there will appear this property in the redux state with the count of pending requests with this specific loadingId.
 So after that call and before the request is finished, you would find your state like this: `state.loadingIds.usersView // 1`.
 
 ### Cache
 
 Right now the cache is only for when we lose connection, it's no for preventing requests to the server.    
  TODO: Implement a cache to prevent server requests
  
If an endpoint is `cacheable` the response will be stored in the local storage every time we receive a server response. 
Afterwards, if we call the same endpoint and the request fails, the api will complete the promise as if it had succeded 
with the data from the cache.
