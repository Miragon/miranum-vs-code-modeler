import * as vscode from 'vscode';
import {BpmnModeler} from "./BpmnModeler";
import {FileSystemScanner} from "./lib/FileSystemScanner";

export function activate(context: vscode.ExtensionContext) {

    const workspaceFolders = vscode.workspace.workspaceFolders;

    // TODO: What should happen with more than one workspaceFolders?
    if (workspaceFolders?.length === 1) {
        const fileSystemScanner = new FileSystemScanner(workspaceFolders[0].uri);
        fileSystemScanner.getElementTemplates()
            .then((results) => {
                context.subscriptions.push(BpmnModeler.register(context, results));
            });
        fileSystemScanner.getForms()
            .then((results) => {
                console.log(results);
                //context.subscriptions.push(BpmnModeler.register(context, results))
            });
    }
}

export function deactivate() {
}
