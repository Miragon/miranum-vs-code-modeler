import {RelativePattern, Uri, Webview, workspace} from "vscode";
import {WorkspaceFolder} from "../types";
import {FileSystemScanner} from "./FileSystemScanner";

export class Watcher {
    private static instance: Watcher;

    private constructor(
        private readonly projectUri: Uri,
        private readonly workspaceFolders: WorkspaceFolder[],
        //private readonly webview: Webview
    ) {
        const reader = FileSystemScanner.createFileSystemScanner(this.projectUri);
        const watcher = workspace.createFileSystemWatcher(this.createGlobPattern());

        watcher.onDidCreate((event) => {
            // extract path
            // extract extension
        });

        watcher.onDidChange((event) => {
        });

        watcher.onDidDelete((event) => {
        });
    }

    public static createWatcher(projectUri: Uri, workspace: WorkspaceFolder[]/*, webview: Webview*/): Watcher {
        if (this.instance === undefined) {
            this.instance = new Watcher(projectUri, workspace);//, webview);
        }
        return this.instance;
    }

    private createGlobPattern(): RelativePattern {
        let folders = '';
        let ext = '';
        const extSet = new Set();  // prevent duplicates
        this.workspaceFolders.forEach((item, index) => {
            folders += item.path;
            extSet.add(item.extension.substring(item.extension.indexOf('.')+1));
            if (this.workspaceFolders.length-1 !== index) { folders += ','; }
        });
        extSet.forEach((item, index) => {
            ext += item;
            if (extSet.size-1 !== index) { ext += ','; }
        });
        const pattern = '**/{' + folders + '}/*.{' + ext + '}';

        return new RelativePattern(this.projectUri, pattern);
    }
}