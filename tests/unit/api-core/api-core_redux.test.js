import ApiCore from '../../../src/api-core';
import fetchMock from "fetch-mock";
import {createStore, combineReducers} from "redux";
import reducer_api from "../../../src/reducers/reducer_api";
import reducer_loading_by_id from "../../../src/reducers/reducer_loading_by_id";
import reducer_loading from "../../../src/reducers/reducer_loading";
import {STATE_ACTION_CONCAT} from "../../../src/constants_api";

describe( 'Api should make use of redux store', ()=> {

    const reducer = combineReducers({api: reducer_api, loadingIds: reducer_loading_by_id, loading: reducer_loading} );
    const store = createStore(reducer);

    const api = new ApiCore({
        host:'https://example.com',
        reduxStore: store,
        endpoints:[
            'users'
        ]
    });

    const users = [{id:1, name:'Mark'}, {id:2, name:'Ehrlich'}];
    const users2 = [{id:3, name:'Yamil'}];
    const users3 = [{id:4, name:'Marko'}, {id:5, name:'Ehrlicho'}];

    fetchMock.get(/https:\/\/example.com\/users\??$/, users );
    fetchMock.get(/https:\/\/example.com\/users\?page=2$/, users2 );
    fetchMock.get(/https:\/\/example.com\/users\?page=3$/, users3 );

    //Simple get into redux
    it('should save the get response into the store', ()=>{

        return api.users.get().then( ()=>{
                expect(store.getState().api.users).toEqual(users);
            }
        );
    });

    it('should concat the server response when using the STATE_ACTION_CONCAT custom redux action', ()=>{

        api.store = createStore(reducer);

        return api.users.get().then( ()=> {

            api.users.get({params: {page: 2}, stateAction: STATE_ACTION_CONCAT}).then(() => {
                    expect(api.store.getState().api.users).toEqual(users.concat(users2));
                }
            );

        });
    });


    it('should replace the old state the same endpoint is when called again', ()=>{


        api.store = createStore(reducer);

        return api.users.get().then( ()=> {
            api.users.get({params: {page: 3}}).then(() => {
                    expect(store.getState().api.users).toEqual(users3);
                }
            );
        });
    });

    it('should erase what\'s saved in the state with clearProperty', ()=>{

        api.store = createStore(reducer);

        return api.users.get().then( ()=> {
            api.clearProperty('users');
            expect(store.getState().api.users).toEqual(undefined);
        });

    });


});
