import type { PathLike } from "node:fs";

import fs from "node:fs/promises";

export const existsPath = (path: PathLike) =>
	fs
		.access(path, fs.constants.F_OK) //
		.then(
			() => true,
			() => false,
		);
