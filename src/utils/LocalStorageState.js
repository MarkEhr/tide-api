
export default class LocalStorageState {

    supported = false;

    constructor( key = 'state' ){

        this.key = key;

        if( window.localStorage ) {
            this.supported = true;
            if( !window.localStorage[ this.key] )
                this._state = {};
            else {
                try {
                    this._state = JSON.parse(window.localStorage[ this.key ] );
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
            Object.assign( this._state, obj);
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
        window.localStorage[ this.key ] = JSON.stringify( this._state );
    }

}