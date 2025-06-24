import type { SetupServer } from 'msw/node';
import { setupServer } from 'msw/node';
import { test as testBase } from 'vitest';
import { handlers } from './handlers.js';

export const test = testBase.extend<{ worker: SetupServer }>({
  worker: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      // Create server for Node.js environment
      const server = setupServer(...handlers);

      // Start the server before the test.
      await server.listen();

      // Expose the server object on the test's context.
      await use(server);

      // Remove any request handlers added in individual test cases.
      // This prevents them from affecting unrelated tests.
      server.resetHandlers();

      // Close the server after the test.
      server.close();
    },
    {
      auto: true,
    },
  ],
});
