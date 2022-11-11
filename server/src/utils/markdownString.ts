import { MarkupContent } from "vscode-languageserver-types";

// Code based on https://github.com/typescript-language-server/typescript-language-server/blob/3722b51c0ad8e758c4e42f622bbe25ae981071e1/src/utils/MarkdownString.ts
export class MarkdownString {
    constructor(public value = '') {}

    appendText(value: string): MarkdownString {
        this.value += escapeMarkdownSyntaxTokens(value)
            .replace(/([ \t]+)/g, (_match, g1) => '&nbsp;'.repeat(g1.length))
            .replace(/>/gm, '\\>')
            .replace(/\n/g, '\\\n');

        return this;
    }

    appendMarkdown(value: string): MarkdownString {
        this.value += value;
        return this;
    }

    appendCodeblock(langId: string, code: string): MarkdownString {
        this.value += '\n```';
        this.value += langId;
        this.value += '\n';
        this.value += code;
        this.value += '\n```\n';
        return this;
    }

    toMarkupContent(): MarkupContent {
        return {
            kind: 'markdown',
            value: this.value,
        };
    }
}

export function escapeMarkdownSyntaxTokens(text: string): string {
    // escape markdown syntax tokens: http://daringfireball.net/projects/markdown/syntax#backslash
    return text.replace(/[\\`*_{}[\]()#+\-!]/g, '\\$&');
}