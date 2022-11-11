import * as vscode from "vscode";
import assert = require("assert");
import { getDocUri, activate } from "./helper";

suite("Should hover", () => {
  test("Hover on ref to parameter", async () => {
    const docUri = getDocUri("hover", "hover.yaml");
    await activate(docUri);

    await testHover(docUri, new vscode.Position(16, 20), '\n```\n(Parameter) Vpc: AWS::EC2::VPC::Id\n```\n');
  });
  test("Hover on ref to resource", async () => {
    const docUri = getDocUri("hover", "hover.yaml");
    await activate(docUri);

    await testHover(docUri, new vscode.Position(20, 31), '\n```\n(Resource) RouteTable1: AWS::EC2::RouteTable\n```\n');
  });
});

export async function testHover(
  docUri: vscode.Uri,
  position: vscode.Position,
  expectedHover: string,
): Promise<void> {
  // Executing the command `vscode.executeHoverProvider` to simulate triggering hover
  const actualHovers = (await vscode.commands.executeCommand(
    "vscode.executeHoverProvider",
    docUri,
    position
  )) as vscode.Hover[];

  const actualHover = actualHovers[0];
  const gotMessage = (<vscode.MarkdownString>actualHover.contents[0]).value;
  assert.equal(expectedHover, gotMessage);
}
