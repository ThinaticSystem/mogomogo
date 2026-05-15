// @ts-check
"use strict";

/**
 * @template {HTMLElement} [THTMLElement=HTMLElement]
 * @typedef {(
 *   & THTMLElement
 *   & {
 *       <TChildElement extends HTMLElement>(
 *         element: TChildElement,
 *         block?: (builder: $BuilderFromElement<TChildElement>) => void,
 *       ): TChildElement;
 * 	   <TChildTagName extends keyof HTMLElementTagNameMap>(
 * 	     tagName: TChildTagName,
 * 	     block?: (builder: $BuilderFromTag<TChildTagName>) => void,
 *       ): HTMLElementTagNameMap[TChildTagName];
 *     }
 * )} $BuilderFromElement
 */
/**
 * @template {keyof HTMLElementTagNameMap} [TTagName=keyof HTMLElementTagNameMap]
 * @typedef {(
 *   & HTMLElementTagNameMap[TTagName]
 *   & {
 *       <TChildElement extends HTMLElement>(
 *         element: TChildElement,
 *         block?: (builder: $BuilderFromElement<TChildElement>) => void,
 *       ): TChildElement;
 *       <TChildTagName extends keyof HTMLElementTagNameMap>(
 *         tagName: TChildTagName,
 *         block?: (builder: $BuilderFromTag<TChildTagName>) => void,
 *       ): HTMLElementTagNameMap[TChildTagName];
 *     }
 * )} $BuilderFromTag
 */

/**
 * Utility type to get tag name from element type
 * @template {HTMLElement} TElement
 * @typedef {{ [K in keyof HTMLElementTagNameMap]: HTMLElementTagNameMap[K] extends TElement ? K : never }[keyof HTMLElementTagNameMap]} TagNameByElement
 */
/**
 * DOM element builder
 * @type {{
 *   <TElement extends HTMLElement>(
 *     element: TElement,
 *     block?: {
 *       (builder: $BuilderFromElement<TElement>): void;
 *       (builder: $BuilderFromTag<TagNameByElement<TElement>>): void;
 *     },
 *   ): TElement;
 *   <TTagName extends keyof HTMLElementTagNameMap>(
 *     tagName: TTagName,
 *     block?: {
 *       (builder: $BuilderFromElement<HTMLElementTagNameMap[TTagName]>): void;
 *       (builder: $BuilderFromTag<TTagName>): void;
 *     },
 *   ): HTMLElementTagNameMap[TTagName];
 * }}
 * @param {HTMLElement | keyof HTMLElementTagNameMap} elementOrTagName
 * @param {(builder: $BuilderFromElement | $BuilderFromTag) => void} [block]
 * @returns {HTMLElement}
 */
export const $ = (elementOrTagName, block) => {
	const element =
		elementOrTagName instanceof HTMLElement
			? elementOrTagName
			: // Builds element if elementOrTagName is tag name
				document.createElement(elementOrTagName);

	/** @type {HTMLElement[]} */
	const children = [];
	/**
	 * @param {HTMLElement | keyof HTMLElementTagNameMap} childElementOrTagName
	 * @param {(builder: $BuilderFromElement | $BuilderFromTag) => void} [childBlock]
	 * @returns {HTMLElement}
	 */
	const childBuilder = (childElementOrTagName, childBlock) => {
		const childElement =
			childElementOrTagName instanceof HTMLElement
				? childElementOrTagName
				: // Builds element with childBlock if childElementOrTagName is tag name
					$(childElementOrTagName, childBlock);
		children.push(childElement);
		return childElement;
	};

	// Merge childBuilder and element
	const elementAndChildBuilder =
		/** @type {$BuilderFromTag<keyof HTMLElementTagNameMap> | $BuilderFromElement<HTMLElement>} */ (
			new Proxy(childBuilder, {
				get(_target, prop) {
					const value = element[/** @type {keyof HTMLElement} */ (prop)];

					if (typeof value === "function") return value.bind(element);
					return value;
				},
				set(_target, prop, value) {
					element[
						/**
						 * Pick writable properties
						 * @type {(
						 *   NonNullable<
						 *     {
						 *       [K in keyof HTMLElement]:
						 *         Pick<HTMLElement, K> extends { readonly [P in K]: unknown }
						 *           ? never
						 *           : K
						 *     }[keyof HTMLElement]
						 *   >
						 * )}
						 */ (prop)
					] = value;
					return true;
				},
			})
		);
	block?.(elementAndChildBuilder);
	element.append(...children);

	return element;
};
