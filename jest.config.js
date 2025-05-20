module.exports = {
    testEnvironment: 'jsdom',
    maxWorkers: 1,
    globals: {
        fetch: global.fetch,
        Request: global.Request,
        Response: global.Response,
        ReadableStream: global.ReadableStream,
    },
};
