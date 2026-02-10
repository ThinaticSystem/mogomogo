import path from "node:path";

const WORKSPACE_PATH = path.resolve(import.meta.dirname, "../..");
export const PATHS = {
	workspace: WORKSPACE_PATH,
	/** `.env` */
	dotEnv: path.relative(WORKSPACE_PATH, ".env"),
} as const;
