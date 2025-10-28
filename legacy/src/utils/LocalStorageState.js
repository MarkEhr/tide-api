
export default class LocalStorageState {

    supported = false;

    constructor( key = 'state', useSessionStorage = false ){

        this.key = key;

        this.storage = useSessionStorage? window.sessionStorage : window.localStorage;
        if( this.storage ) {
            this.supported = true;
            if( !this.storage.getItem(this.key) )
                this._state = {};
            else {
                try {
                    this._state = JSON.parse(this.storage.getItem(this.key) );
                }
                catch(error){
                    this._state = {};
                }
            }

        }
        else
            console.log("Local Storage not supported.");
    }

    store( obj ){
        if( this.supported ){
            this._state = {...this._state, ...obj};
            this.persist();
        }
        else
            console.log("Local Storage not supported.");

    }

    getState(){
        if( this.supported ){
            return this._state;
        }
        else
            console.log("Local Storage not supported.");
    }

    persist(){
        this.storage.setItem(this.key, JSON.stringify( this._state ));
    }

}
