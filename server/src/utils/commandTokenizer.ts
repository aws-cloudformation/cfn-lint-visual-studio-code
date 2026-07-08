#!/usr/bin/env node
/*
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License").
You may not use this file except in compliance with the License.
A copy of the License is located at

	http://www.apache.org/licenses/LICENSE-2.0

or in the "license" file accompanying this file. This file is distributed
on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
express or implied. See the License for the specific language governing
permissions and limitations under the License.
*/

/**
 * Splits a command string into an argv-style array WITHOUT invoking a shell.
 *
 * The `cfnLint.path` setting is allowed to carry embedded arguments (for
 * example `cfn-lint --registry-schemas /some/dir`). Historically the process
 * was launched with `{ shell: true }`, which honored that embedded-argument
 * form but also made every shell metacharacter (`;`, `|`, `$(...)`, backticks,
 * `&&`, redirection, ...) executable. This tokenizer keeps the quote-aware,
 * whitespace-separated splitting users rely on while performing NO expansion
 * or substitution, so any metacharacter is carried through verbatim as a
 * literal argv token instead of being interpreted by a shell.
 *
 * Quoting rules (backslash is deliberately NOT an escape character):
 *   - single quotes: everything between them is literal
 *   - double quotes: everything between them is literal (no variable or
 *     command substitution, since no shell is involved)
 *   - a backslash is an ordinary character, so Windows paths such as
 *     `C:\Python\Scripts\cfn-lint.exe` are preserved verbatim. Paths that
 *     contain spaces must be wrapped in quotes, exactly as before.
 *
 * @param command raw command string (may be empty)
 * @returns argv tokens; the first entry is the executable
 */
export function tokenizeCommand(command: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let hasToken = false;
  let quote: '"' | "'" | null = null;

  for (let i = 0; i < command.length; i++) {
    const ch = command[i];

    if (quote) {
      if (ch === quote) {
        quote = null;
      } else {
        current += ch;
      }
      hasToken = true;
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      hasToken = true;
      continue;
    }

    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
      if (hasToken) {
        tokens.push(current);
        current = "";
        hasToken = false;
      }
      continue;
    }

    current += ch;
    hasToken = true;
  }

  if (hasToken) {
    tokens.push(current);
  }

  return tokens;
}
