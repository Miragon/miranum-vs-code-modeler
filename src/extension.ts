import * as vscode from 'vscode';
import {BpmnModeler} from "./BpmnModeler";
import {FileSystemScanner} from "./lib/FileSystemScanner";

export function activate(context: vscode.ExtensionContext) {

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders?.length === 1) {
        const fileSystemScanner = new FileSystemScanner(workspaceFolders[0].uri);
        console.log(fileSystemScanner.getElementTemplates());
    }

    context.subscriptions.push(BpmnModeler.register(context));
}

export function deactivate() {
}
