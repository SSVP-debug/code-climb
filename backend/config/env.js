import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(
  fileURLToPath(import.meta.url)
);

const envPath = path.resolve(__dirname, "../.env");

const result = dotenv.config({ path: envPath });

if (result.error) {
  console.warn(
    `[env] Could not load ${envPath}:`,
    result.error.message
  );
} else {
  console.log(`[env] Loaded ${envPath}`);
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
