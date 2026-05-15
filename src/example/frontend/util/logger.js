// @ts-check
"use strict";

import { $console } from "../view.js";

/**
 * @param {"debug" | "info" | "warn" | "error"} logLevel
 * @param {string} message
 */
const print = (logLevel, message) => {
	console[logLevel](message);
	$console.textContent += `[${logLevel.toUpperCase()}] ${message}\n`;
};

/**
 * @param {unknown[]} args
 */
const joinArgs = (args) =>
	args //
		.map((arg) => String(arg))
		.join(" ");

/**
 * @param {string} context
 */
export const loggerOf = (context) => /** @type {const} */ ({
	/**
	 * @param {unknown[]} args
	 */
	debug: (...args) => print("debug", `${context}: ${joinArgs(args)}`),
	/**
	 * @param {unknown[]} args
	 */
	info: (...args) => print("info", `${context}: ${joinArgs(args)}`),
	/**
	 * @param {unknown[]} args
	 */
	warn: (...args) => print("warn", `${context}: ${joinArgs(args)}`),
	/**
	 * @param {unknown[]} args
	 */
	error: (...args) => print("error", `${context}: ${joinArgs(args)}`),
});
