// cPanel Passenger startup file
// This file is the entry point that Passenger uses to start the app.
// It simply loads the Nitro server output.

const { createServer } = require("http");
const { readFileSync } = require("fs");
const { join } = require("path");

// Passenger sets the port via the 'PORT' environment variable
const port = process.env.PORT || 3000;

// Dynamic import of the ESM server entry
async function start() {
  const server = await import(join(__dirname, ".output", "server", "index.mjs"));
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
