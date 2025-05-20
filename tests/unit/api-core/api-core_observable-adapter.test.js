import ApiCore from '../../../src/api-core';
import fetchMock from 'fetch-mock';
import ObservableAdapter from '../../../src/stateAdapters/ObservableAdapter';

fetchMock.mockGlobal();

describe('Observable adapter', () => {
    const adapter = new ObservableAdapter();
    const api = new ApiCore({
        host: 'https://example.com',
        stateAdapter: adapter,
        endpoints: ['users']
    });

    const users = [{id:1, name:'Mark'}];
    fetchMock.get(/https:\/\/example.com\/users\??$/, users);

    it('notifies listeners when state changes', () => {
        const listener = jest.fn();
        adapter.subscribe(listener);
        return api.users.get().then(() => {
            expect(listener).toHaveBeenCalled();
            expect(adapter.getState().api.users).toEqual(users);
        });
    });
});
