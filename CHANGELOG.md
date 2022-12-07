# Change Log
All notable changes to the "vscode-cfn-lint" extension will be documented in this file.

## 0.24.0
- Add support for `Ref` in hover and autocomplete (pull #[248](https://github.com/aws-cloudformation/aws-cfn-lint-visual-studio-code/pull/248))
- Update how we determine what a CloudFormation template is (pull #[250](https://github.com/aws-cloudformation/aws-cfn-lint-visual-studio-code/pull/250))
- Update JSON Spec to be based on the registry (pull #[251](https://github.com/aws-cloudformation/aws-cfn-lint-visual-studio-code/pull/251))

## 0.23.4
- Fix an issue where validation is run on file change (pull #[245](https://github.com/aws-cloudformation/aws-cfn-lint-visual-studio-code/pull/245))

## 0.23.3
- Fix preview command not showing graph (pull #[243](https://github.com/aws-cloudformation/aws-cfn-lint-visual-studio-code/pull/243))

## 0.23.2
- Disable `documentRangeFormattingProvider` and `documentFormattingProvider` in server capabilities (pull #[234](https://github.com/aws-cloudformation/aws-cfn-lint-visual-studio-code/pull/234))

## 0.23.1
- Update the formatter handler to only handle yaml files (pull #[231](https://github.com/aws-cloudformation/aws-cfn-lint-visual-studio-code/pull/231))

## 0.23.0
- Removed dependency on plugin `vscode-yaml` (pull #[228](https://github.com/aws-cloudformation/aws-cfn-lint-visual-studio-code/pull/228))
- Include `yaml-language-server` as a library in server package (pull #[228](https://github.com/aws-cloudformation/cfn-lint-visual-studio-code/pull/228))

## 0.22.0
- Updated CloudFormation Specs (pull #[212](https://github.com/aws-cloudformation/aws-cfn-lint-visual-studio-code/pull/212))
- Include Information checks by default (pull #[223](https://github.com/aws-cloudformation/cfn-lint-visual-studio-code/pull/223))
- Update a lot of dependencies (pull #[226](https://github.com/aws-cloudformation/cfn-lint-visual-studio-code/pull/226))

## 0.18.0
- Update deployment and testing to use GitHub Actions
- Update CloudFormation Template Schema to `31.1.0` (pull #[160](https://github.com/aws-cloudformation/aws-cfn-lint-visual-studio-code/pull/160))

## 0.12.2
- Update autocomplete data to spec version 15.2.0 (pull #[112](https://github.com/aws-cloudformation/aws-cfn-lint-visual-studio-code/pull/112))

## 0.1.0
- Initial release
