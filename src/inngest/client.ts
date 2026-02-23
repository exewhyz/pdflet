import { Inngest } from 'inngest';
import config from '../config/index.js';

/**
 * Shared Inngest client — used by both function definitions and event sends.
 */
export const inngest = new Inngest({
  id: 'pdf-template-saas',
  eventKey: config.inngest.eventKey,
});
