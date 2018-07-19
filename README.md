# vscode-cfn-lint

VS Code CloudFormation Linter uses cfn-lint to lint your CloudFormation templates.

## Features

Uses [cfn-lint](https://github.com/awslabs/cfn-python-lint) to parse and show issues with CloudFormation templates

For example if there is an image subfolder under your extension project workspace:

![features](/images/features.png)

## Requirements

Requires cfn-lint to be installed: `pip install cfn-lint`

More information about cfn-lint can be found [here](https://github.com/awslabs/cfn-python-lint)

## Extension Settings

* `cfnLint.path`: path to the cfn-lint command
* `cfnLint.appendRules`: Array of paths containing additional Rules
* `cfnLint.ignoreRules`: Array of Rule Ids to be ignored
* `cfnLint.overrideSpecPath`: Path to an Specification overrule file

## Contribute

The code for this plugin can be found on GitHub at [awslabs/aws-cfn-lint-visual-studio-code](https://github.com/awslabs/aws-cfn-lint-visual-studio-code)