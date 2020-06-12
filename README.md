# vscode-cfn-lint
[![Version](https://img.shields.io/visual-studio-marketplace/v/kddejong.vscode-cfn-lint.svg?style=flat)](https://marketplace.visualstudio.com/items?itemName=kddejong.vscode-cfn-lint)
[![Version](https://img.shields.io/visual-studio-marketplace/d/kddejong.vscode-cfn-lint.svg?style=flat
)](https://marketplace.visualstudio.com/items?itemName=kddejong.vscode-cfn-lint)

VS Code CloudFormation Linter uses cfn-lint to lint your CloudFormation templates.
<img alt="[cfn-lint logo]" src="https://raw.githubusercontent.com/awslabs/aws-cfn-lint-visual-studio-code/master/logo.png" width="150" align="right">

## Features

- Uses [cfn-lint](https://github.com/aws-cloudformation/cfn-python-lint) to parse the template and show problems with it.

- Uses [pydot]((https://pypi.org/project/pydot/)) to preview the template as a graph of resources.

![features](/images/features.png)

## Requirements

Requires `cfn-lint` to be installed: `pip install cfn-lint`.

If you want to be able to preview templates as graphs, you also need to install `pydot`: `pip install pydot`.

## Extension Settings

* `cfnLint.path`: path to the `cfn-lint` command
* `cfnLint.appendRules`: Array of paths containing additional Rules
* `cfnLint.ignoreRules`: Array of Rule Ids to be ignored
* `cfnLint.overrideSpecPath`: Path to a specification override file

## Contribute

The code for this plugin can be found on GitHub at [awslabs/aws-cfn-lint-visual-studio-code](https://github.com/awslabs/aws-cfn-lint-visual-studio-code)
