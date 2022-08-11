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
import { Connection } from 'vscode-languageserver';
import {
  RequestPreview, PreviewClosed
} from '../requestTypes';
import { SettingsState } from '../cfnSettings';
import { ValidationHandler } from './validationHandler';


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
	this.connection.onNotification(RequestPreview.type, (uri: string) => this.requestPreview(uri));
	this.connection.onNotification(PreviewClosed.type, (uri: string) => this.previewClosed(uri));
  }

  private requestPreview(uri: string): void {
	this.connection.console.log('preview requested: ' + uri);
	this.cfnSettings.isPreviewing[uri] = true;
	this.validationHandler.validateTextDocument(this.cfnSettings.documents.get(uri));
  }

  private previewClosed(uri: string): void {
	this.connection.console.log('preview closed: ' + uri);
	this.cfnSettings.isPreviewing[uri] = false;
  }
}
