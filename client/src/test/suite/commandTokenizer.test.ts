import * as assert from "assert";
import * as path from "path";

// The tokenizer lives in the language server package. The client tsconfig sets
// rootDir to "src", so it cannot be TS-imported across packages; require the
// compiled server output at runtime instead (the server is compiled before the
// tests run via `npm run compile`).
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { tokenizeCommand } = require(path.resolve(
  __dirname,
  "../../../../server/out/utils/commandTokenizer"
)) as { tokenizeCommand: (command: string) => string[] };

suite("tokenizeCommand", () => {
  suite("preserves legitimate configuration", () => {
    test("a bare executable name is a single token", () => {
      assert.deepStrictEqual(tokenizeCommand("cfn-lint"), ["cfn-lint"]);
    });

    test("arguments embedded in the path are split on whitespace", () => {
      assert.deepStrictEqual(
        tokenizeCommand("cfn-lint --registry-schemas /some/dir"),
        ["cfn-lint", "--registry-schemas", "/some/dir"]
      );
    });

    test("collapses runs of whitespace and ignores tabs", () => {
      assert.deepStrictEqual(tokenizeCommand("cfn-lint\t-c  I"), [
        "cfn-lint",
        "-c",
        "I",
      ]);
    });

    test("a quoted path containing spaces stays one token", () => {
      assert.deepStrictEqual(tokenizeCommand('"/opt/my tools/cfn-lint"'), [
        "/opt/my tools/cfn-lint",
      ]);
      assert.deepStrictEqual(tokenizeCommand("'/opt/my tools/cfn-lint'"), [
        "/opt/my tools/cfn-lint",
      ]);
    });

    test("backslashes are literal so Windows paths are preserved", () => {
      assert.deepStrictEqual(
        tokenizeCommand("C:\\Python311\\Scripts\\cfn-lint.exe"),
        ["C:\\Python311\\Scripts\\cfn-lint.exe"]
      );
    });

    test("a quoted Windows path with spaces stays one token", () => {
      assert.deepStrictEqual(
        tokenizeCommand('"C:\\Program Files\\Python\\cfn-lint.exe"'),
        ["C:\\Program Files\\Python\\cfn-lint.exe"]
      );
    });

    test("a Windows path with an embedded argument splits on whitespace only", () => {
      assert.deepStrictEqual(
        tokenizeCommand(
          "C:\\Python311\\Scripts\\cfn-lint.exe --registry-schemas C:\\schemas"
        ),
        [
          "C:\\Python311\\Scripts\\cfn-lint.exe",
          "--registry-schemas",
          "C:\\schemas",
        ]
      );
    });

    test("empty or whitespace-only input yields no tokens", () => {
      assert.deepStrictEqual(tokenizeCommand(""), []);
      assert.deepStrictEqual(tokenizeCommand("   \t "), []);
    });
  });

  // These are the security-relevant cases: shell metacharacters must survive as
  // inert literal argv tokens, never as separators or operators. Because the
  // process is spawned with shell:false, a single token can only ever be one
  // argument to cfn-lint, so none of these can start a new command.
  suite("does not interpret shell metacharacters", () => {
    test("a semicolon does not start a new command", () => {
      assert.deepStrictEqual(tokenizeCommand("cfn-lint; touch /tmp/pwned"), [
        "cfn-lint;",
        "touch",
        "/tmp/pwned",
      ]);
    });

    test("command substitution is kept literal", () => {
      assert.deepStrictEqual(tokenizeCommand("cfn-lint $(touch /tmp/pwned)"), [
        "cfn-lint",
        "$(touch",
        "/tmp/pwned)",
      ]);
    });

    test("backticks are kept literal", () => {
      assert.deepStrictEqual(tokenizeCommand("`touch /tmp/pwned`"), [
        "`touch",
        "/tmp/pwned`",
      ]);
    });

    test("pipe and logical operators are kept literal", () => {
      assert.deepStrictEqual(tokenizeCommand("cfn-lint | sh && rm -rf /"), [
        "cfn-lint",
        "|",
        "sh",
        "&&",
        "rm",
        "-rf",
        "/",
      ]);
    });

    test("metacharacters inside double quotes are not expanded", () => {
      assert.deepStrictEqual(tokenizeCommand('cfn-lint "$(id)`whoami`;rm"'), [
        "cfn-lint",
        "$(id)`whoami`;rm",
      ]);
    });

    test("a redirection character is kept literal", () => {
      assert.deepStrictEqual(tokenizeCommand("cfn-lint > /etc/passwd"), [
        "cfn-lint",
        ">",
        "/etc/passwd",
      ]);
    });
  });
});
