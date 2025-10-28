# Tide API

> Modern, type-safe TypeScript library for consuming REST APIs

[![npm version](https://img.shields.io/npm/v/tide-api.svg)](https://www.npmjs.com/package/tide-api)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Features

- ✨ **Beautiful API** - Proxy-based dynamic endpoint access (`api.users.get()`)
- 🔒 **Type-Safe** - Full TypeScript support with generics
- 🔌 **Extensible** - Plugin system for authentication, caching, and more
- 🎯 **Interceptors** - Transform requests and responses with ease
- 🚀 **Modern** - Built on native fetch API
- 📦 **Tiny** - Zero dependencies, tree-shakeable
- 🧩 **Flexible** - Works with any REST API

## Installation

```bash
npm install tide-api
```

```bash
yarn add tide-api
```

```bash
pnpm add tide-api
```

## Quick Start

```typescript
import { ApiClient } from 'tide-api';

// Create an API client
const api = new ApiClient({
  baseUrl: 'https://api.example.com',
  endpoints: ['users', 'posts'],
});

// Use it
const users = await api.users.get();
const newUser = await api.users.create({
  params: { name: 'John', email: 'john@example.com' }
});
```

## Why Tide API?

Tide API makes REST API consumption elegant and type-safe. Instead of manually constructing URLs and managing fetch calls, you get:

```typescript
// Without Tide API ❌
const response = await fetch('https://api.example.com/users/123', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Jane' })
});
const user = await response.json();

// With Tide API ✅
const user = await api.users.update({
  id: 123,
  params: { name: 'Jane' }
});
```

## Documentation

Full documentation coming soon. For now, check out the [examples](./examples) directory.

## Development Status

🚧 **v2.0.0 is currently in active development**

This is a complete TypeScript rewrite of tide-api. The v1 codebase is available in the `legacy` folder for reference.

## License

MIT © Mark Ehrlich
