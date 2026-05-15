type AsciiColorEscapes = `\x1b[${string}m`;

/** ASCII color codes presets */
const COLORS = {
	cyan: "\x1b[36m",
	yellow: "\x1b[33m",
	red: "\x1b[31m",
	gray: "\x1b[90m",
	initial: "\x1b[0m",
} as const satisfies Record<string, AsciiColorEscapes>;
/** Generates a unique color for each ID */
const withOwnColor = (() => {
	const colorMap = new Map<string, AsciiColorEscapes>();

	return (id: string) => {
		const knownEscape = colorMap.get(id);
		if (knownEscape) {
			return knownEscape;
		}

		// Generates a color based on the hash of the ID
		const hash = Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0);
		const colorCode = 16 + (hash % 216); // 16-231 are the 6x6x6 color palette in 256-color ANSI
		const escape = `\x1b[38;5;${colorCode}m` as const;

		colorMap.set(id, escape);
		return escape;
	};
})();

/** Wraps text with the given ASCII color escape */
const colored = (color: AsciiColorEscapes, text: string) => `${color}${text}${COLORS.initial}`;

/**
 * @param context Log prefix tag text
 * @returns {Logger}
 */
export const loggerOf = (context: string) => {
	return {
		info: (...args: unknown[]) =>
			console.info(
				colored(COLORS.cyan, "[INFO]"),
				`${colored(withOwnColor(context), context)}:`,
				...args,
			),
		warn: (...args: unknown[]) =>
			console.warn(
				colored(COLORS.yellow, "[WARN]"),
				`${colored(withOwnColor(context), context)}:`,
				...args,
			),
		error: (...args: unknown[]) =>
			console.error(
				colored(COLORS.red, "[ERROR]"),
				`${colored(withOwnColor(context), context)}:`,
				...args,
			),
		debug: (...args: unknown[]) =>
			console.debug(
				colored(COLORS.gray, "[DEBUG]"),
				`${colored(withOwnColor(context), context)}:`,
				...args,
			),
	};
};
