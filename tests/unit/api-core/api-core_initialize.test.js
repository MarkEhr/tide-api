import ApiCore from '../../../src/api-core';

describe( 'New Api should initialize correctly', ()=> {

    it('breaks with with no config provided', () => {

        try {
            new ApiCore();
            fail();
        } catch (e) {

            const errorType = e instanceof Error;
            expect(errorType).toBeTruthy();
            expect(e.message).toBe("Missing required parameter 'host' to initialize API");
        }

    });

    it('doesn\'t break with minimal configuration', () => {

        const api = new ApiCore({host: 'https://example.com'});

        const apiType = api instanceof ApiCore;
        expect(apiType).toBeTruthy();
    });

});