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
import { Connection } from "vscode-languageserver";
import {
  RequestPreview,
  PreviewClosed,
  ValidateCfnLintVersion,
} from "../../requestTypes";
import { SettingsState } from "../../cfnSettings";
import { ValidationHandler } from "./validationHandler";
import { CfnVersion } from "../../service/services/cfnVersion";
import { gt } from "semver";
import fetch from "node-fetch";

// code adopted from https://github.com/redhat-developer/yaml-language-server/blob/main/src/languageserver/handlers/notificationHandlers.ts
export class NotificationHandler {
  private cfnSettings: SettingsState;
  private validationHandler: ValidationHandler;

  constructor(
    private readonly connection: Connection,
    yamlSettings: SettingsState,
    validationHandler: ValidationHandler
  ) {
    this.cfnSettings = yamlSettings;
    this.validationHandler = validationHandler;
  }

  public registerHandlers(): void {
    this.connection.onNotification(RequestPreview.type, (uri: string) =>
      this.requestPreview(uri)
    );
    this.connection.onNotification(PreviewClosed.type, (uri: string) =>
      this.previewClosed(uri)
    );
    this.connection.onNotification(ValidateCfnLintVersion.type, () =>
      this.validateCfnLintVersion()
    );
  }

  private requestPreview(uri: string): void {
    this.connection.console.log("preview requested: " + uri);
    this.cfnSettings.isPreviewing[uri] = true;
    this.validationHandler.validateTextDocument(
      this.cfnSettings.documents.get(uri)
    );
  }

  private previewClosed(uri: string): void {
    this.connection.console.log("preview closed: " + uri);
    this.cfnSettings.isPreviewing[uri] = false;
  }

  private validateCfnLintVersion(): void {
    const cfnLint = new CfnVersion(this.cfnSettings.cfnLintPath);
    const cfnLintExec = cfnLint.exec();
    cfnLintExec.then((cliVersion) => {
      this.getLatestVersion()
        .then((latestVersion) => {
          try {
            if (gt(latestVersion, cliVersion)) {
              this.connection.sendNotification("cfn/cfnLintUpgradeNeeded", {
                cliVersion: cliVersion,
                latestVersion: latestVersion,
              });
            }
          } catch (error) {
            console.debug(error);
          }
        })
        .catch((error) => {
          console.debug(error);
        });
    });
  }

  public async getLatestVersion(): Promise<string> {
    const url =
      "https://api.github.com/repos/aws-cloudformation/cfn-lint/releases/latest";
    try {
      const response = await fetch(url);
      const data = await response.json();

      // @ts-ignore
      return data["tag_name"].replace("v", "");
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
