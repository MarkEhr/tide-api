import ApiCore from '../../../src/api-core';
import fetchMock from "fetch-mock";

fetchMock.config.overwriteRoutes = true;

describe( 'New Api should login correctly', ()=> {

    const api = new ApiCore({
        host:'https://example.com'
    });

    //Well forged requests

    it('should make a POST request without breaking', ()=>{

        const token = {token:'1234'};

        fetchMock
            .post(/https:\/\/example.com\/login_check\??$/ ,token );

        return api.login().then( (response)=>{
                expect(response).toEqual(token);
            }
        );

    });

    it('should save the token in "this"', ()=>{

        const token = {token:'1234'};

        fetchMock
            .post(/https:\/\/example.com\/login_check\??$/ ,token );

        return api.login().then( ()=>{
                expect(api.token).toEqual('1234');
            }
        );

    });

    it('should not save the token in localStorage with the default settings',  ()=>{

        const token = {token:'1234'};

        fetchMock
            .post(/https:\/\/example.com\/login_check\??$/ ,token );

        return api.login().then(()=> {
            expect(localStorage.tideApiToken).toBeUndefined();
        });

    });

    const api2 = new ApiCore({
        host:'https://example.com',
        saveTokenToLocalStorage:true
    });


    it('should save the token in localStorage with the default key',  ()=>{

        const token = {token:'1234'};

        fetchMock
            .post(/https:\/\/example.com\/login_check\??$/ ,token );

        return api2.login().then(()=>{
            expect(localStorage.tideApiToken).toEqual(token.token);
        })

    });


    const api3 = new ApiCore({
        host:'https://example.com',
        login: {
            path: 'test'
        }
    });

    it('should use the path in the configuration',  ()=>{

        const token = {token:'1234'};

        fetchMock
            .post(/https:\/\/example.com\/test\??$/ ,token );

        return api3.login().then((resp)=>{
            expect(resp).toEqual(token);
        });

    });

    const api4 = new ApiCore({
        host:'https://example.com',
        commonPath:'common',
        login: {
            path: 'test'
        }
    });

    it('should use the path in the configuration and the common path',  ()=>{

        const token = {token:'1234'};

        fetchMock
            .post(/https:\/\/example.com\/common\/test\??$/ ,token );

        return api4.login().then((resp)=>{
            expect(resp).toEqual(token);
        });

    });


});
