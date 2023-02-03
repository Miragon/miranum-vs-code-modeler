import {RelativePattern, Uri, Webview, workspace} from "vscode";
import {WorkspaceFolder} from "../types";
import {FileSystemReader} from "./FileSystemReader";

export class Watcher {
    private static instance: Watcher;
    private webviews: Map<string, Webview> = new Map();
    private response: {[id: string]: boolean} = {};
    private changes: Set<string> = new Set();

    private constructor(
        private readonly projectUri: Uri,
        private readonly workspaceFolders: WorkspaceFolder[],
    ) {
        const reader = FileSystemReader.getFileSystemReader(this.projectUri, this.workspaceFolders);
        const watcher = workspace.createFileSystemWatcher(this.createGlobPattern());

        const notify = async (uri: string) => {
            const path = this.getDirectory(uri.toString());
            try {
                this.changes.add(path);
                this.notify(await reader.getFilesAsJson(path, this.getExtension(path)));
            } catch (error) {
                console.error(error);
            }
        };

        watcher.onDidCreate((uri) => {
            notify(uri.toString());
        });

        watcher.onDidChange((uri) => {
            notify(uri.toString());
        });

        watcher.onDidDelete((uri) => {
            notify(uri.toString());
        });
    }

    public static getWatcher(projectUri: Uri, workspace: WorkspaceFolder[]/*, webview: Webview*/): Watcher {
        if (this.instance === undefined) {
            this.instance = new Watcher(projectUri, workspace);//, webview);
        }
        return this.instance;
    }

    public getResponse(id: string): boolean {
        return this.response[id];
    }

    public subscribe(id: string, webview: Webview): void {
        this.webviews.set(id, webview);
        this.response[id] = false;
    }

    public unsubscribe(id: string): void {
        this.webviews.delete(id);
        delete this.response[id];
    }

    public async update(id: string, webview: Webview) {
        const reader = FileSystemReader.getFileSystemReader(this.projectUri, this.workspaceFolders);
        for (const dir of this.changes) {
            try {
                webview.postMessage({
                    type: 'FileSystemWatcher.reloadFiles',
                    text: await reader.getFilesAsJson(dir, this.getExtension(dir))
                });
                this.response[id] = true;
            } catch (error) {
                console.log('[FileSystemWatcher]' + error);
                // Todo: Show message to user
                this.response[id] = false;
            }
        }
    }

    private notify(files: JSON[]): void {
        this.webviews.forEach((webview, key) => {
            try {
                webview.postMessage({
                    type: 'FileSystemWatcher.reloadFiles',
                    text: files
                });
                this.response[key] = true;
            } catch (error) {
                console.log('[FileSystemWatcher]' + error);
                // Todo: Show message to user
                this.response[key] = false;
            }
        });
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

    private getDirectory(uri: string): string {
        // Todo: Extract the directory from given URI
        const filename = uri.replace(/^.*[\\\/]/, '');
        return uri.substring(0, uri.indexOf(filename));
    }

    private getExtension(dir: string): string {
        this.workspaceFolders.forEach((folder) => {
            if (folder.path === dir) {
                return folder.extension;
            }
        });
        throw new Error('[FileSystemWatcher] -> Could not find ' + dir + 'in the tracked directories!');
    }
}