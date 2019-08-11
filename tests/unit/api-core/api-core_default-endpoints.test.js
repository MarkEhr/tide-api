import ApiCore from '../../../src/api-core';
import fetchMock from 'fetch-mock';

describe('An endpoint configured as a string should have basic methods', ()=>{

    const api = new ApiCore({
        host:'https://example.com',
        endpoints: ['users']
    });

    //Created correctly

    it('should create the endpoint as an object', ()=>{
        expect(typeof api.users ).toBe('object');
    });
    it('should contain get method', ()=>{
        expect(typeof api.users.get ).toBe('function');
    });
    it('should contain create method', ()=>{
        expect(typeof api.users.create ).toBe('function');
    });
    it('should contain update method', ()=>{
        expect(typeof api.users.update ).toBe('function');
    });
    it('should contain delete method', ()=>{
        expect(typeof api.users.delete ).toBe('function');
    });

    //Well forged requests

    it('should make a get request', ()=>{

        const users = [{id:1,name:'Mark'}];
        fetchMock
            .get(/https:\/\/example.com\/users\??$/ , users);

        api.users.get().then( (response)=>{
                expect(response).toEqual(users);
            }
        );

    });

    it('should make a post request', ()=>{

        const sentUser = {name:'Mark'};
        const receivedUser = {id:1, name:'Mark'};

        const mock = fetchMock
            .post(/https:\/\/example.com\/users\??$/ , receivedUser);

        api.users.create( {params:sentUser} ).then( (response)=>{
                expect(response).toEqual(receivedUser);
            }
        );

        expect( mock.lastCall()[1].body ).toBe(JSON.stringify(sentUser));
    });

    it('should make a put request', ()=>{

        const sentUser = {name:'Marko'};
        const receivedUser = {id:1, name:'Marko'};

        const mock = fetchMock
            .put(/https:\/\/example.com\/users\/1\??$/ , receivedUser);

        try {
            api.users.update({params: sentUser});
        }
        catch( e ){
            const isError = e instanceof Error;
            expect(isError).toBeTruthy();
            expect(e.message).toBe('The update endpoint requires an id to be sent in the config object');
        }

        api.users.update({id:1, params: sentUser})
            .then((resp)=>{
                expect(resp).toEqual(receivedUser);
            });

        expect( mock.lastCall()[1].body ).toBe(JSON.stringify(sentUser));
    });

    it('should make a delete request', ()=>{

        fetchMock
            .delete(/https:\/\/example.com\/users\/1\??$/ , 204);

        try {
            api.users.delete();
        }
        catch( e ){
            const isError = e instanceof Error;
            expect(isError).toBeTruthy();
            expect(e.message).toBe('The delete endpoint requires an id to be sent in the config object');
        }

        api.users.delete({id:1});
    });



    it('default strict mode should not let you call a random endpoint', ()=>{
        expect(typeof api.unconfiguredEndpoint ).toBe('undefined');
    });

});