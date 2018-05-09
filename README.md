# vscode-cfn-lint

VS Code CloudFormation Linter uses cfn-lint to lint your CloudFormation templates.

## Features

Uses cfn-lint to parse and show issues with CloudFormation templates

For example if there is an image subfolder under your extension project workspace:

![features](/images/features.png)

## Requirements

Requires cfn-lint to be installed.  `pip install cfn-lint`

## Extension Settings

* `cfnLint.path`: path to the cfn-lint command
