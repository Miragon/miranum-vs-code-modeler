import * as vscode from "vscode";

export class FileSystemScanner {

    static readonly fs = vscode.workspace.fs;

    constructor(
        private readonly projectUri: vscode.Uri
    ) {
    }

    public getElementTemplates() {
        const uri = vscode.Uri.joinPath(this.projectUri, 'element-templates');

        const json = FileSystemScanner.fs.readDirectory(uri)
            .then((files) => {
                files.forEach((file) => {
                    const fileUri = vscode.Uri.joinPath(uri, file[0]);
                    return FileSystemScanner.fs.readFile(fileUri)
                        .then((content) => {
                            return Buffer.from(content).toString('utf-8');
                        });
                });
            });


        const printJson = async () => {
            const a = await  json;
            console.log('getElementTemplates', a);
        };

        printJson();
    }

    /*
    private readFile(directory: vscode.Uri): Thenable<string> {
        FileSystemScanner.fs.readDirectory(directory)
            .then((files) => {
                files.forEach((file) => {
                    const fileUri = vscode.Uri.joinPath(directory, file[0]);
                    FileSystemScanner.fs.readFile(fileUri)
                        .then((content) => {
                            const jsonString Buffer.from(content).toString('utf-8');
                            console.log(jsonString)
                        });
                });
            });
    }
    */
}