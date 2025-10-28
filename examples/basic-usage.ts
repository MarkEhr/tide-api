/**
 * Basic usage example for Tide API with strict type-safe endpoints
 */

import { createApiClient } from '../src';

// Define types for your API responses
interface User {
  id: number;
  name: string;
  email: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  userId: number;
}

// Create an API client with strict typing (default)
// TypeScript will only allow accessing 'users' and 'posts'
// Trying to access api.unknown will cause a TypeScript error
const api = createApiClient({
  baseUrl: 'https://jsonplaceholder.typicode.com',
  endpoints: ['users', 'posts'] as const, // 'as const' enables strict typing
  strictMode: true, // default: only defined endpoints accessible
  debug: true,
});

// Example usage
async function main() {
  try {
    // GET all users
    console.log('\n=== Fetching all users ===');
    const users = await api.users.get<User[]>();
    console.log(`Found ${users.length} users`);

    // GET a single user
    console.log('\n=== Fetching user with ID 1 ===');
    const user = await api.users.get<User>({ id: 1 });
    console.log('User:', user);

    // GET all posts
    console.log('\n=== Fetching all posts ===');
    const posts = await api.posts.get<Post[]>();
    console.log(`Found ${posts.length} posts`);

    // GET posts with query params
    console.log('\n=== Fetching posts for user 1 ===');
    const userPosts = await api.posts.get<Post[]>({
      params: { userId: 1 },
    });
    console.log(`User 1 has ${userPosts.length} posts`);

    // CREATE a new post
    console.log('\n=== Creating a new post ===');
    const newPost = await api.posts.create<Post>({
      params: {
        title: 'Test Post',
        content: 'This is a test post created with Tide API',
        userId: 1,
      },
    });
    console.log('Created post:', newPost);

    // UPDATE a post
    console.log('\n=== Updating post 1 ===');
    const updatedPost = await api.posts.update<Post>({
      id: 1,
      params: {
        title: 'Updated Title',
        content: 'Updated content',
        userId: 1,
      },
    });
    console.log('Updated post:', updatedPost);

    // DELETE a post
    console.log('\n=== Deleting post 1 ===');
    await api.posts.delete({ id: 1 });
    console.log('Post deleted successfully');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
main();
