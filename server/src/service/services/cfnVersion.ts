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

import { spawn, ChildProcess } from "child_process";
import { Diagnostic } from "vscode-languageserver";

export class CfnVersion {
  child: ChildProcess;
  diagnostics: Diagnostic[];
  stdout: string;
  start: number;
  end: number;

  constructor(cmd: string) {
    this.child = spawn(cmd, ["--version"], {
      shell: true,
    });
    this.start = 0;
    this.end = Number.MAX_VALUE;
    this.stdout = "";
  }

  exec(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const handlers = {
        resolve,
        reject,
      };
      this.child.on("error", (err) => this._onError(err));
      this.child.stdout.on("data", (data) => this._onStdOutData(data));
      this.child.on("close", () => this._onClose(handlers));
    });
  }

  private _onError(err: Error): void {
    console.log(err);
  }

  private _onStdOutData(data: Buffer) {
    this.stdout = this.stdout.concat(
      data.toString().replace("cfn-lint ", "").trim()
    );
    return;
  }

  private _onClose(handlers: any) {
    handlers.resolve(this.stdout);
  }
}
