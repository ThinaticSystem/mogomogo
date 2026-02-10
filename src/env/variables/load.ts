import { mapAsync } from "../../util/collection.ts";
import { existsPath } from "../../util/path.ts";
import { PATHS } from "../path.ts";

/**
 * Looks for the existing `.env` file in the following order:
 * 1. `.env`
 * @returns The path of the found .env file, or `null` if none found
 */
const getDotEnvPath = async () => {
	const paths = [PATHS.dotEnv] as const satisfies string[];

	for await (const { path, exists } of mapAsync(paths, async (path) => ({
		path,
		exists: await existsPath(path),
	}))) {
		if (exists) {
			return path;
		}
	}
	// No .env file found
	return null;
};

/** Loads .env file if exists */
export const loadDotEnv = async () => {
	const dotEnvPath = await getDotEnvPath();
	if (dotEnvPath !== null) {
		console.info(`Loading environment variables from "${dotEnvPath}"`);
		process.loadEnvFile(dotEnvPath);
	} else {
		console.info("No .env file detected");
	}
};
