import * as vscode from 'vscode';
import {BpmnModeler} from "./BpmnModeler";

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(BpmnModeler.register(context));
}

export function deactivate() {
}
