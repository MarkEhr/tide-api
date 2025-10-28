import LocalStorageState from "./LocalStorageState";


/**
 * A queue object would be an array of objects with all the parameters of an apiCall as properties
 */

export default class QueueManager {

    constructor(api, storageKey, interval = 180000) {

        this.api = api;
        this.interval = interval;

        this.storage = new LocalStorageState(storageKey);

        const state = this.storage.getState();
        this._queue = state.apiQueue ? state.apiQueue : [];

        if( this._queue.length )
            this.startQueueInterval();
    }


    startQueueInterval = () => {

        this.intervalId = setInterval(() => {

            if ( this._queue.length )
                this.executeQueue();
            else
                clearInterval( this.intervalId );

        }, this.interval);

    };

    push = ( item )=>{

        const newQueue = [ ...this._queue, this.prepareItemForStore( item ) ];

        this.storage.store({apiQueue: newQueue});
        this._queue = newQueue;

        this.startQueueInterval();

        return this;
    };

    shift = ()=>{

        const newQueue = [ ...this._queue ];
        newQueue.shift();

        this.storage.store({apiQueue: newQueue});
        this._queue = newQueue;

        return this;
    };

    executeQueue = () => {

        if( !this._queue.length )
            return;

        const item = this.reconstructStoredItem( this._queue[0] );
        const {path, property, params, config, files} = item;

        this.api.apiCall(path, property, params, config, files)
            .then(() => {

                this.shift();
                this.executeQueue();

            });

    };

    createQueueItem = (path, property, params, config, files) => {

        const newConfig = {...config, queueable: false, preventNotifier: true};
        return prepareItemForStore({path, property, params, config: newConfig, files});
    };

    prepareItemForStore = (item) => {
        const prepared = {...item};
        if (prepared.files)
            delete prepared.files;
        return prepared;
    };

    reconstructStoredItem = (item) => {
        //TODO: save files in prepareItemForStore and retrieve it here
        return item;
    };
}