import { handlers } from '@/mocks/handlers';
import { setupWorker } from 'msw/browser';

// Setup the worker with our request handlers
export const worker = setupWorker(...handlers);
