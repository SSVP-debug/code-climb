import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(
  fileURLToPath(import.meta.url)
);

const envPath = path.resolve(__dirname, "../.env");

const result = dotenv.config({ path: envPath });

if (result.error) {
  // Deliberately console.warn, not the pino logger: config/logger.js reads
  // process.env.LOG_LEVEL / NODE_ENV, both of which this dotenv.config()
  // call is responsible for populating in local dev. Importing the logger
  // here would risk it initializing before env vars are loaded, depending
  // on import order elsewhere — console.warn has no such dependency, and
  // this is a one-line startup notice, not something that needs to be
  // structured/aggregated like request logs.
  console.warn(
    `[env] Could not load ${envPath}:`,
    result.error.message
  );
}

export function getMongoUri() {
  const uri = process.env.MONGODB_URI?.trim();

  if (!uri) {
    throw new Error(
      "MONGODB_URI is missing. Set it in backend/.env (single line, no line breaks)."
    );
  }

  if (uri.includes("\n") || uri.includes("\r")) {
    throw new Error(
      "MONGODB_URI must be on a single line in backend/.env"
    );
  }

  if (
    uri.includes("<db_password>") ||
    uri.includes("YOUR_PASSWORD_HERE")
  ) {
    throw new Error(
      "MONGODB_URI still contains a password placeholder. Replace it with your real MongoDB password."
    );
  }

  return uri;
}

export function maskMongoUri(uri) {
  return uri.replace(
    /:\/\/([^:]+):([^@]+)@/,
    "://$1:***@"
  );
}