# Change Log
All notable changes to the "vscode-cfn-lint" extension will be documented in this file.

## 0.25.5
- Update CloudFormation schema files as of `2024-04-24` (pull #[386](https://github.com/aws-cloudformation/aws-cfn-lint-visual-studio-code/pull/386))
- Fix an issue with symbols being falsy in json (pull #[387](https://github.com/aws-cloudformation/aws-cfn-lint-visual-studio-code/pull/387))

## 0.25.4
- Update CloudFormation schema files as of `2024-03-21` (pull #[374](https://github.com/aws-cloudformation/aws-cfn-lint-visual-studio-code/pull/374))

## 0.25.3
- Update CloudFormation schema files as of `2023-12-13` (pull #[364](https://github.com/aws-cloudformation/aws-cfn-lint-visual-studio-code/pull/364))
- Fix a formatting issue (pull #[363](https://github.com/aws-cloudformation/aws-cfn-lint-visual-studio-code/pull/363))
- Fix an issue when disabling completion (pull #[362](https://github.com/aws-cloudformation/aws-cfn-lint-visual-studio-code/pull/362))

## 0.25.2
- Validate cfn-lint versions on launch (pull #[360](https://github.com/aws-cloudformation/aws-cfn-lint-visual-studio-code/pull/360))
- Update CloudFormation schema files as of `2023-12-13` (pull #[354](https://github.com/aws-cloudformation/aws-cfn-lint-visual-studio-code/pull/354))

## 0.25.1
- Fix relative path for schema files (pull #[352](https://github.com/aws-cloudformation/aws-cfn-lint-visual-studio-code/pull/352))
- Update CloudFormation schema files as of `2023-11-02` (pull #[345](https://github.com/aws-cloudformation/aws-cfn-lint-visual-studio-code/pull/345))

## 0.25.0
- Update CloudFormation schema files as of `2023-10-11` (pull #[309](https://github.com/aws-cloudformation/aws-cfn-lint-visual-studio-code/pull/309))
- Update all packages as of  `2023-10-11` (pull #[343](https://github.com/aws-cloudformation/aws-cfn-lint-visual-studio-code/pull/343), #[342](https://github.com/aws-cloudformation/aws-cfn-lint-visual-studio-code/pull/342), #[341](https://github.com/aws-cloudformation/aws-cfn-lint-visual-studio-code/pull/341), #[340](https://github.com/aws-cloudformation/aws-cfn-lint-visual-studio-code/pull/340), #[334](https://github.com/aws-cloudformation/aws-cfn-lint-visual-studio-code/pull/334), #[339](https://github.com/aws-cloudformation/aws-cfn-lint-visual-studio-code/pull/339), #[335](https://github.com/aws-cloudformation/aws-cfn-lint-visual-studio-code/pull/335))

## 0.24.5
- Fix an issue with formatting indentation and `&emsp` with yaml language server (pull #[311](https://github.com/aws-cloudformation/aws-cfn-lint-visual-studio-code/pull/311))

## 0.24.4
- Update CloudFormation schema files as of `2023-04-27` (pull #[298](https://github.com/aws-cloudformation/aws-cfn-lint-visual-studio-code/pull/298))
- Update language server to not try get symbols when not CloudFormation (pull #[307](https://github.com/aws-cloudformation/aws-cfn-lint-visual-studio-code/pull/307))
- Update language server to not do autocomplete when not CloudFormation (pull #[307](https://github.com/aws-cloudformation/aws-cfn-lint-visual-studio-code/pull/307))

## 0.24.3
- Update CloudFormation schema files as of `2023-03-06` (pull #[258](https://github.com/aws-cloudformation/aws-cfn-lint-visual-studio-code/pull/258))

## 0.24.2
- Update `yaml-language-server` to `1.10.0` (pull #[258](https://github.com/aws-cloudformation/aws-cfn-lint-visual-studio-code/pull/258))

## 0.24.1
- Update CloudFormation schema files and clean up `patternProperties` with bad regex patterns (pull #[255](https://github.com/aws-cloudformation/aws-cfn-lint-visual-studio-code/pull/255))

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
