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
"use strict";

import * as path from "path";
import * as fs from "fs";
import {
  workspace,
  ExtensionContext,
  window,
  WebviewPanel,
  Uri,
  commands,
  ViewColumn,
  window as VsCodeWindow,
} from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
  ErrorHandler,
  Message,
  ErrorAction,
  CloseAction,
  CloseHandlerResult,
  ErrorHandlerResult,
} from "vscode-languageclient/node";

let previews: { [index: string]: WebviewPanel } = {};
let languageClient: LanguageClient;

export async function activate(context: ExtensionContext) {
  // The server is implemented in node
  let serverModule = context.asAbsolutePath(
    path.join("server", "out", "server.js")
  );
  // The debug options for the server
  let debugOptions = { execArgv: ["--nolazy", "--inspect=6010"] };

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  let serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions,
    },
  };

  // Options to control the language client
  let clientOptions: LanguageClientOptions = {
    // Register the server for plain text documents
    documentSelector: [
      { scheme: "file", language: "yaml" },
      { scheme: "file", language: "json" },
    ],
    synchronize: {
      configurationSection: "cfnLint",
      // Notify the server about file changes to '.clientrc files contain in the workspace
      fileEvents: [
        workspace.createFileSystemWatcher("**/.clientrc"),
        workspace.createFileSystemWatcher("**/*.?(e)y?(a)ml"),
      ],
    },
    errorHandler: new ClientErrorHandler(4),
  };

  // Create the language client and start the client.
  languageClient = new LanguageClient(
    "cfnLint",
    "CloudFormation linter Language Server",
    serverOptions,
    clientOptions
  );
  await languageClient.start();

  languageClient.onNotification("cfn/busy", () => {
    window.showInformationMessage(
      "Linter is already running. Please try again."
    );
  });
  languageClient.onNotification("cfn/previewIsAvailable", (uri) => {
    reloadSidePreview(uri, languageClient);
  });
  languageClient.onNotification("cfn/isPreviewable", (value) => {
    commands.executeCommand("setContext", "isPreviewable", value);
  });
  languageClient.onNotification("cfn/fileclosed", (uri) => {
    // if the user closed the template itself, we close the preview
    if (previews[uri]) {
      previews[uri].dispose();
    }
  });

  languageClient.onNotification("cfn/cfnLintUpgradeNeeded", (params) => {
    window.showInformationMessage(
      `You are using an outdated version of cfn-lint (${params["cli_version"]}). The latest version is ${params["latest_version"]}.`
    );
  });

  languageClient.sendNotification("cfn/validateCfnLintVersion");

  let previewDisposable = commands.registerCommand(
    "extension.sidePreview",
    () => {
      if (window.activeTextEditor.document) {
        let uri = Uri.file(
          window.activeTextEditor.document.fileName
        ).toString();

        languageClient.sendNotification("cfn/requestPreview", uri);
      }
    }
  );

  context.subscriptions.push(previewDisposable);
}

function reloadSidePreview(file: string, languageClient: LanguageClient) {
  let uri = Uri.parse(file);
  let stringifiedUri = uri.toString();
  let dotFile = uri.fsPath + ".dot";

  if (!fs.existsSync(dotFile)) {
    window.showErrorMessage(
      "Error previewing graph. Please run `pip3 install cfn-lint pydot --upgrade`"
    );
    return;
  }
  let content = fs.readFileSync(dotFile, "utf8");

  if (!previews[stringifiedUri]) {
    previews[stringifiedUri] = VsCodeWindow.createWebviewPanel(
      "cfnLintPreview", // Identifies the type of the webview. Used internally
      "Template: " + dotFile.slice(0, -4), // Title of the panel displayed to the user
      ViewColumn.Two, // Editor column to show the new webview panel in.
      {
        enableScripts: true,
      }
    );
    previews[stringifiedUri].onDidDispose(() => {
      // if the user closed the preview
      delete previews[stringifiedUri];
      fs.unlinkSync(dotFile);
      languageClient.sendNotification("cfn/previewClosed", stringifiedUri);
    });
  }

  const panel = previews[stringifiedUri];
  panel.webview.html = getPreviewContent(content);
}

function getPreviewContent(content: String): string {
  let multilineString = "`" + content + "`";
  // FIXME is there a better way of converting from dot to svg that is not using cdn urls?
  return `
	<!DOCTYPE html>
	<body>
		<script src="https://cdn.jsdelivr.net/npm/d3@5.16.0/dist/d3.min.js" integrity="sha256-Xb6SSzhH3wEPC4Vy3W70Lqh9Y3Du/3KxPqI2JHQSpTw=" crossorigin="anonymous"></script>
		<script src="https://cdn.jsdelivr.net/npm/@hpcc-js/wasm@0.3.14/dist/index.min.js" integrity="sha256-GQQPKRntjhRqIwXvSCfytweTuDgJQ7hnK3RGsln9HWc=" crossorigin="anonymous"></script>
		<script src="https://cdn.jsdelivr.net/npm/d3-graphviz@3.1.0/build/d3-graphviz.min.js" integrity="sha256-WRJh26uDo3BP+SjibjTwXI66JLkDFXmreIGpKm0xHV8=" crossorigin="anonymous"></script>
		<div id="graph" style="text-align: center;"></div>
		<script>
			d3.select("#graph")
			.graphviz()
			.width(screen.width)
			.height(screen.height)
			.renderDot(${multilineString});
		</script>
	</body>
`;
}

export function deactivate(): Thenable<void> | undefined {
  if (!languageClient) {
    return undefined;
  }
  return languageClient.stop();
}

export class ClientErrorHandler implements ErrorHandler {
  private restarts: number[] = [];
  constructor(private readonly maxRestartCount: number) {}

  //@ts-ignore
  error(error: Error, message: Message, count: number): ErrorHandlerResult {
    if (count && count <= 3) {
      return {
        action: ErrorAction.Continue,
        message: error.message,
        handled: true,
      };
    }
    return {
      action: ErrorAction.Shutdown,
      message: error.message,
      handled: true,
    };
  }

  closed(): CloseHandlerResult {
    this.restarts.push(Date.now());
    if (this.restarts.length <= this.maxRestartCount) {
      return {
        action: CloseAction.Restart,
        message: "Restarting cfn-lint extension",
      };
    } else {
      const diff = this.restarts[this.restarts.length - 1] - this.restarts[0];
      if (diff <= 3 * 60 * 1000) {
        const message = `The cfn-lint server crashed ${
          this.maxRestartCount + 1
        } times in the last 3 minutes. The server will not be restarted.`;
        window.showErrorMessage(message);
        return {
          action: CloseAction.DoNotRestart,
          message: message,
        };
      } else {
        this.restarts.shift();
        return {
          action: CloseAction.Restart,
          message: "Restart cfn-lint extension",
        };
      }
    }
  }
}
