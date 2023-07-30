import dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const envConfig = () => {
  const env =
    process.env.NODE_ENV?.trim() !== "production"
      ? "dev.config.env"
      : "prod.config.env";
  dotenv.config({
    path: path.resolve(__dirname, "../../", "config/", `${env}`),
  });
};

const isBoolean = (value) =>
  ["true", "false"].includes(value) ? JSON.parse(value) : value;

const getEnv = (name) => isBoolean(process.env[name]);

export { getEnv, envConfig };
