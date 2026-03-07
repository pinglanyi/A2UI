/*
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import MarkdownIt from "markdown-it";
import type { RenderRule } from "markdown-it/lib/renderer.mjs";

const markdownIt = MarkdownIt();

function applyTagClassMap(
  tagClassMap: Record<string, string[]>
): Map<string, RenderRule | undefined> {
  const originalRules = new Map<string, RenderRule | undefined>();

  Object.entries(tagClassMap).forEach(([tag, classes]) => {
    let tokenName: string | undefined;
    switch (tag) {
      case "p":
        tokenName = "paragraph";
        break;
      case "h1":
      case "h2":
      case "h3":
      case "h4":
      case "h5":
      case "h6":
        tokenName = "heading";
        break;
      case "ul":
        tokenName = "bullet_list";
        break;
      case "ol":
        tokenName = "ordered_list";
        break;
      case "li":
        tokenName = "list_item";
        break;
      case "a":
        tokenName = "link";
        break;
      case "strong":
        tokenName = "strong";
        break;
      case "em":
        tokenName = "em";
        break;
    }

    if (!tokenName) return;

    const key = `${tokenName}_open`;
    const original = markdownIt.renderer.rules[key];
    originalRules.set(key, original);

    markdownIt.renderer.rules[key] = (tokens, idx, options, _env, self) => {
      const token = tokens[idx];
      for (const clazz of classes) {
        token.attrJoin("class", clazz);
      }
      if (original) {
        return original(tokens, idx, options, _env, self);
      }
      return self.renderToken(tokens, idx, options);
    };
  });

  return originalRules;
}

function unapplyTagClassMap(
  originalRules: Map<string, RenderRule | undefined>
) {
  for (const [key, original] of originalRules) {
    markdownIt.renderer.rules[key] = original;
  }
}

/**
 * Renders a markdown string to an HTML string.
 *
 * Optionally accepts a tag class map to apply CSS classes to rendered HTML
 * elements. For example, `{ p: ["my-class"] }` applies `my-class` to all
 * `<p>` elements in the output.
 *
 * Note: MarkdownIt doesn't enable HTML in its output by default, so the
 * output is safe to insert into the DOM.
 * @see https://github.com/markdown-it/markdown-it/blob/master/docs/security.md
 */
export function renderMarkdown(
  value: string,
  tagClassMap?: Record<string, string[]>
): string {
  let originalRules: Map<string, RenderRule | undefined> | undefined;
  if (tagClassMap) {
    originalRules = applyTagClassMap(tagClassMap);
  }
  const htmlString = markdownIt.render(value);
  if (originalRules) {
    unapplyTagClassMap(originalRules);
  }
  return htmlString;
}
