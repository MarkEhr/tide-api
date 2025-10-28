import LocalStorageState from "./LocalStorageState";
import md5 from 'js-md5';


export default class CacheManager {

    constructor( storageKey ){

        this.storage = new LocalStorageState( storageKey );

        const state = this.storage.getState();
        this._cache = state.apiCache? state.apiCache : {};

    }

    saveToCache = ( data, url, params ) => {

        const newCache = { ...this._cache };

        const key = this.createCacheKey(url, params);
        newCache[key] = data;

        this.storage.store({apiCache: newCache});
        this._cache = newCache;

        return this;
    };

    searchCache = (url, params ) => {

        const key = this.createCacheKey(url, params);
        return this._cache[key];
    };

    createCacheKey = (url, params ) => {

        if (!params)
            params = '';
        return url + '-' + md5( JSON.stringify(params));
    };

}