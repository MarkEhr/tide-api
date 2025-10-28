module.exports = {
    testEnvironment: 'jsdom',
    globals: {
        fetch: global.fetch,
        Request: global.Request,
        Response: global.Response,
        ReadableStream: global.ReadableStream,
    },
};
