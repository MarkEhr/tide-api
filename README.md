# TIDE API

Utility to easily consume a rest api in a browser javascript project.

### Getting started

To start using the library you should create an `api` object with the basic config:

    import API from 'tide-api';
    
    const config = {
                       host: "https://example.com",
                       endpoints: [
                           "users"
                       ]
                   }
    
    const api = new API( config )
    
    api.{endpointname}.get(); //Promise
    
### Config parameters

The configuration should be an object which could contain the following properties:

| Property         |type       |    Default    | Description |
|------------------|-----------|---------------|-------------|
|appendHeaders     | function  | undefined     | A function to modify the headers of each request. It will receive the headers created as first argument and it should modify this same object. The headers are in a plain object. The returned value is ignored 
|commonPath        |string     | empty string  |The path to append to the `host` on each request. It could be already appended to the `host` property if you don't intend to overwrite it in any endpoint.
|createHeaders     | function  | function      | The function to create the headers to send in each request. Called with the options sent to the `apiCall` in an object as first argument. This object is augmented with the boolean property `useFormData` which may have been forced with the `files` apiCall argument
|credentials       | string    | "omit"        | Set the credentials parameter of the request. See [available options](https://developer.mozilla.org/en-US/docs/Web/API/Request/credentials)
|endpoints (required)|array    | -             |An array describing each endpoint, see [next section](#endpoint-configuration) for endpoints' properties
|getDataFromResponse|function  |`(response)=>response`|Before storing the result to redux, this method will be called and its result will be stored. The default method returns the same data like: `( response, headers )=>response`
|getMetaDataFromResponse|function|`()=>undefined`|To extract meta data from the response ( like page, total items, etc. ), then the returned object will be stored in redux with the key `{endpointName}Meta`. The method has the signature `(response, headers)=>object`
|host (required)   |string     | -             |The url to which the  request will be done. It should contain the protocol.
|localStorageKey   |string     | "api"         | The key to use in the local storage to save log-in state and cache data
|login             |object     | <default login conf> | For login usage and configuration see [the login section](#login)
|nameToPath        |function   | See description| A function to create the api path from the endpoint name. By default it converts from camel case to snake case. e.g. ( "personProfile" ) => "person_profile"
|parseJson         |boolean    | true          |If true and the server response has "content-type: json", the response will be parsed before resolving the api's promise
|queryStringOptions|object     | { arrayFormat: 'brackets' } | Options for converting the request parameters to a GET query string. See [qs](https://github.com/ljharb/qs#stringifying) for available options.
|queueInterval     |integer    | 180000        | Time in milliseconds between each try to resend a request when it is queued
|reduxStore        |object     | undefined     |The redux store to dispatch endpoints actions. See [Redux](#Redux) to know how to use it
|saveTokenToLocalStorage|boolean&#124;"safari" | false | Whether to save the authentication token to local storage or not. See [Why to do that](#authentication-tokens-and-local-storage).
|strictMode        |boolean    | true          | If set to false, any endpoint could be called without defining it in the `endpoints` array. It will be called as if it were defined as a string.
|tokenKey          |string     | "tideApiToken"    | The key to use in the local storage to save the token

### Endpoint configuration

The available endpoints in the api should be defined in the `endpoints` property of the main config object. An endpoint could be defined in two ways:    

##### Define an endpoint as a string    

If an endpoint from the `endpoints` array is a string, an automatic endpoint will be created with the following methods: `create`, `get`, `update` and `delete`.   
This endpoint will be a property of the api object, here's an example of how to use it:   
      
    const api = new API( {
        host: "https://example.com",
        endpoints: [
            "users"
        ]
    } );
    
    console.log( api.users );//{ create: fn, get: fn, update: fn, delete: fn }
    
    api.users.get() // Promise
        .then( users=>{
            //Use the users returned from the server
         })
         
    api.users.create( endpointArguments ) // Promise
        .then( user=>{
            //Use the created user returned from the server
         })
     
Like that you could use any of the methods automatically defined and a promise which resolves to the server response ( already parsed if it's a json ) will be returned.

The default endpoints accept an `endpointArguments` object, which may have any of the following properties:

|name      | type      | description
|----------|-----------|--------------
|params    | object    | Info to send to the server. How it is sent depends on the method, in GET requests are sent as query string, in all the other methods they're sent as a json in the request body.
|method    | string    | The request method to use, the default depends on the endpoint type as follows, `get` -> "GET", `create` -> "POST", `update` -> "PUT", `delete` -> "DELETE"
|credentials| string   | Overrides the `credentials` parameter of the request set in the global configuration.
|customProp| string    | For redux integration. This changes the name with which the response will be saved to redux. By default it's the same as the endpoint's name
|files     | object    | Files to append to the request. They are ignored if method is set to "GET". If set, the option `useFormData` is always set to true. It could be a `File` object in which case will be sent with the property name set to "file". It could be an `Array` in which case al files will be appended with a property name of "files[]". It could be and object where every file will be appended with a property name of the key inside the object that corresponds. ( objects are not recursively appended )
|stateAction| string   | This says how to modify redux's state. See [redux section for available options](#Redux)
|useFormData| boolean  | Default to false. If true, the params are sent with `FormData` formatting in the request body. This is ignored if the method is set to "GET". This is enforced if the `files` property is set.

##### Define an endpoint as an object

If you want to customize the endpoint's behavior you could send an object to change any part of the request made.

### Login

There's a default login implementation based on making a login request, saving the received token (if it's not saved as 
a cookie already), and persisting it to the local storage.   
To attempt a login just call the `login()` method of an api object, like:    

```
const api = new Api(apiConfig);
api.login( user, password)
```
    
Afterwards you can start to make other api calls and the login state should remain until expired o manually logged out.   
The available login configuration that could be sent in the `login` key of the main config object is the following:

|name      | type      | default           | description
|----------|-----------|-------------------|------------
|path      | string    |"login_check"      |The path to append to the url to make the login request
|method    | string    |"POST"             |Http method to use in the request
|createBody|function   |(username, password)=>FormData|The function to create the request body. This function receives the same arguments sent when calling `api.login()`. By default the function creates a `FormData` object appending the first argument with the key `_username` and the second argument as `_password`
|parseJson|boolean    |true               |Whether to try to parse the response before returning the promise
|tokenExtractor|function|(json)=>json.token|The function to extract the login token information from the response. If `parseJson` is set to `true`, this will receive the parsed response, otherwise it will receive the response object. It should return the token string 
 

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
 
 #### Redux state actions
 
 TODO: Write this section
 
 ### Cache
 
 Right now the cache is only for when we lose connection, it's no for preventing requests to the server.    
  TODO: Implement a cache to prevent server requests
  
If an endpoint is `cacheable` the response will be stored in the local storage every time we receive a server response. 
Afterwards, if we call the same endpoint and the request fails, the api will complete the promise as if it had succeded 
with the data from the cache.
