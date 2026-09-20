import { defineNitroConfig } from 'nitro/config';

// Build for Node server so `node .output/server/index.mjs` works locally
export default defineNitroConfig({
  preset: 'node-server',
});
