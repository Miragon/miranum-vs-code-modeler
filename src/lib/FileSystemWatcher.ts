import {RelativePattern, Uri, Webview, WebviewPanel, workspace} from "vscode";
import {WorkspaceFolder} from "../types";
import {FileSystemReader} from "./FileSystemReader";

export class Watcher {
    private static instances: {[root: string]: Watcher} = {};
    private webviews: Map<string, WebviewPanel> = new Map();
    private unresponsive: {[id: string]: Webview} = {};
    private changes: Set<string> = new Set();

    private constructor(
        private readonly projectUri: Uri,
        private readonly workspaceFolders: WorkspaceFolder[],
    ) {
        //const reader = FileSystemReader.getFileSystemReader();
        const watcher = workspace.createFileSystemWatcher(this.createGlobPattern());

        //const notify = async (uri: string) => {
        //    const dir = this.getDirectory(uri.toString());
        //    try {
        //        this.changes.add(dir);
        //        this.notify(await reader.getFilesAsJson(this.projectUri, dir, this.getExtension(dir)));
        //    } catch (error) {
        //        console.error(error);
        //    }
        //};

        watcher.onDidCreate((uri) => {
            this.notify(uri);
        });

        watcher.onDidChange((uri) => {
            this.notify(uri);
        });

        watcher.onDidDelete((uri) => {
            this.notify(uri);
        });
    }

    public static getWatcher(projectUri: Uri, workspace: WorkspaceFolder[]): Watcher {
        const root = projectUri.toString();
        if (this.instances[root] === undefined) {
            this.instances[root] = new Watcher(projectUri, workspace);
        }
        return this.instances[root];

        //if (this.instance === undefined) {
        //    this.instance = new Watcher(projectUri, workspace);
        //}
        //return this.instance;
    }

    public subscribe(id: string, webviewPanel: WebviewPanel): void {
        this.webviews.set(id, webviewPanel);
    }

    public unsubscribe(id: string): void {
        this.webviews.delete(id);
        delete this.unresponsive[id];
        // Todo: Delete watcher from this.instances if no webviews exists anymore?
    }

    public async update(id: string, webviewPanel: WebviewPanel) {
        if (!this.unresponsive[id]) {
            // webview was already updated
            return;
        }

        const reader = FileSystemReader.getFileSystemReader();
        // todo: use reader.getAllFiles
        //  list all workspceFolders which are in this.changes
        for (const dir of this.changes) {
            try {
                webviewPanel.webview.postMessage({
                    type: 'FileSystemWatcher.reloadFiles',
                    text: await reader.getFilesAsJson(this.projectUri, dir, this.getExtension(dir))
                });
                delete this.unresponsive[id];
                if (webviewPanel.visible) {
                    // Todo: Show message to user
                }
            } catch (error) {
                this.unresponsive[id] = webviewPanel.webview;
                if (webviewPanel.visible) {
                    // Todo: Show message to user
                }
                console.log('[FileSystemWatcher]' + error);
            }
        }
    }

    private async notify(uri: Uri) {
        const reader = FileSystemReader.getFileSystemReader();

        try {
            const [dir, ext] = this.getDirectoryAndExtension(uri.toString());
            this.changes.add(dir);
            const files = await reader.getFilesAsJson(this.projectUri, dir, ext);
            for (const [id, webviewPanel] of this.webviews) {
                try {
                    webviewPanel.webview.postMessage({
                        type: 'FileSystemWatcher.reloadFiles',
                        text: files
                    });
                    delete this.unresponsive[id];
                    if (webviewPanel.visible) {
                        // Todo: Show message to user
                    }
                } catch (error) {
                    this.unresponsive[id] = webviewPanel.webview;
                    if (webviewPanel.visible) {
                        // Todo: Show message to user
                    }
                    console.log('[FileSystemWatcher]' + error);
                }
            }

        } catch (error) {
            console.log('[FileSystemWatcher]' + error);
        }


        //const files = await reader.getFilesAsJson(this.projectUri, dir, this.getExtension(dir));

        //this.changes.add(dir);
        //this.webviews.forEach((webview, key) => {
        //    try {
        //        webview.postMessage({
        //            type: 'FileSystemWatcher.reloadFiles',
        //            text: files
        //        });
        //        this.response[key] = true;
        //        // Todo: Show message to user
        //    } catch (error) {
        //        console.log('[FileSystemWatcher]' + error);
        //        // Todo: Show message to user
        //        this.response[key] = false;
        //    }
        //});
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

        let index = 0;
        for (const value of extSet) {
            ext += value;
            if (extSet.size-1 !== index) { ext += ','; }
            index++;
        }

        const pattern = '**/{' + folders + '}/*.{' + ext + '}';

        return new RelativePattern(this.projectUri, pattern);
    }

    private getDirectoryAndExtension(uri: string): [dir: string, ext: string] {
        // Todo: Extract the directory from given URI
        const path = uri.replace(this.projectUri.toString(), '');
        const dirs = path.split('/');
        for (const folder of this.workspaceFolders) {
            if (folder.path === dirs[0]) {
                return [folder.path, folder.extension];
            }
        }
        throw new Error('[FileSystemWatcher] -> Could not find ' + dirs[0] + 'in the tracked directories!');
    }

    //private getExtension(dir: string): string {
    //    for (const folder of this.workspaceFolders) {
    //        if (folder.path === dir) {
    //            return folder.extension;
    //        }
    //    }
    //    throw new Error('[FileSystemWatcher] -> Could not find ' + dir + 'in the tracked directories!');
    //}
}