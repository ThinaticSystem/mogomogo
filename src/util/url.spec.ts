import { suite, test } from "vitest";

import { queryStringFrom } from "./url.ts";

suite.concurrent("queryStringFrom()", () => {
	test("object with string values", ({ expect }) => {
		const result = queryStringFrom({
			numeric: "123",
			alphabet: "honi",
			symbol: "!@#$%^&*()_+-=[]{}|;':\",./<>?",
			japanese: "ほに",
			emoji: "🥴",
			empty: "",
			undefined: "undefined",
			null: "null",
			false: "false",
			zero: "0",
		});
		expect(result).toBe(
			"numeric=123" +
				"&alphabet=honi" +
				"&symbol=!%40%23%24%25%5E%26*()_%2B-%3D%5B%5D%7B%7D%7C%3B'%3A%22%2C.%2F%3C%3E%3F" +
				"&japanese=%E3%81%BB%E3%81%AB" +
				"&emoji=%F0%9F%A5%B4" +
				"&empty=" +
				"&undefined=undefined" +
				"&null=null" +
				"&false=false" +
				"&zero=0",
		);
	});

	test("object with boolean values", ({ expect }) => {
		const result = queryStringFrom({
			false: false,
			true: true,
		});
		expect(result).toBe("false=false&true=true");
	});

	test("empty object", ({ expect }) => {
		const result = queryStringFrom({});
		expect(result).toBe("");
	});

	test("object with single key-value pair", ({ expect }) => {
		const result = queryStringFrom({ key: "value" });
		expect(result).toBe("key=value");
	});

	test("object with undefined value", ({ expect }) => {
		const result = queryStringFrom({ a: "value", b: undefined, c: 123 });
		expect(result).toBe("a=value&c=123");
	});

	test("object with single undefined value", ({ expect }) => {
		const result = queryStringFrom({ a: undefined });
		expect(result).toBe("");
	});

	test("object with special characters", ({ expect }) => {
		const result = queryStringFrom({
			"key with spaces": "value with spaces",
		});
		expect(result).toBe("key%20with%20spaces=value%20with%20spaces");
	});
});
