import * as vscode from "vscode";

export class FileSystemScanner {

    static readonly fs = vscode.workspace.fs;

    constructor(
        private readonly projectUri: vscode.Uri
    ) {
    }

    public getElementTemplates() {
        const uri = vscode.Uri.joinPath(this.projectUri, 'element-templates');
        return this.getJson(this.readFile(uri));
    }

    public getForms() {
        const uri = vscode.Uri.joinPath(this.projectUri, 'forms');
        return this.getJson(this.readFile(uri));
    }

    private getJson(thenable: Thenable<Awaited<string>[]>): Thenable<Array<JSON>> {
        return thenable
            .then((results) => {
                const elementTemplates: Array<JSON> = [];
                results.forEach((result) => {
                    elementTemplates.push(JSON.parse(result));
                });
                return elementTemplates;
            });

    }

    private readFile(directory: vscode.Uri): Thenable<Awaited<string>[]> {
        return FileSystemScanner.fs.readDirectory(directory)
            .then((files) => {
                const promises: Array<Thenable<string>> = [];
                files.forEach((file) => {
                    const fileUri = vscode.Uri.joinPath(directory, file[0]);
                    promises.push(FileSystemScanner.fs.readFile(fileUri)
                        .then((content) => {
                            return Buffer.from(content).toString('utf-8');
                        }));
                });
                return Promise.all(promises);
            });
    }
}