import { expect } from "vitest";

type AssertInstance = <T>(
	constructor_: new (...args: any[]) => T,
	value: unknown,
) => asserts value is T;
/** `toBeInstanceOf()` in assertion function */
export const assertInstance: AssertInstance = (constructor_, value) => {
	expect(value).toBeInstanceOf(constructor_);
};
