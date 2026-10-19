/**
 * Vercel Function entry: the same Hono server as `server/main.js`, which owns
 * `/api/*` and the request context the React Router app reads (CSP nonce,
 * session), exported as a fetch handler instead of listening on a port.
 * Static files are served by Vercel from `build/client`.
 */
import { fileURLToPath } from 'node:url';

import handle from 'hono-react-router-adapter/node';

import { getLoadContext } from '../build/server/hono/server/load-context.js';
import server from '../build/server/hono/server/router.js';
import * as build from '../build/server/index.js';

// Vercel starts the function with cwd=/var/task but places apps/remix files under /var/task/apps/remix;
// the PDF renderers read `public/...` relative to cwd.
process.chdir(fileURLToPath(new URL('..', import.meta.url)));

const handler = handle(build, server, { getLoadContext });

export default { fetch: handler.fetch };
