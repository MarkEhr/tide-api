import SimpleAdapter from './SimpleAdapter';

export default class ObservableAdapter extends SimpleAdapter {
    constructor(initialState){
        super(initialState);
        this.listeners = new Set();
    }

    subscribe(listener){
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    notify(){
        for(const listener of Array.from(this.listeners)){
            try{
                listener(this.getState());
            } catch(e){
                // ignore listener errors
            }
        }
    }

    dispatch(action){
        super.dispatch(action);
        this.notify();
    }
}
