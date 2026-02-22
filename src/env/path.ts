import path from "node:path";

const WORKSPACE_PATH = path.resolve(import.meta.dirname, "../..");
/** Resolve a path relative to the workspace root */
const ws = (...paths: readonly string[]) => path.resolve(WORKSPACE_PATH, ...paths);
export const PATHS = {
	workspace: WORKSPACE_PATH,
	/** `.env` */
	dotEnv: ws(".env"),
} as const;
