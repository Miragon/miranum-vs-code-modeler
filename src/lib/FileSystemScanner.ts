import * as vscode from "vscode";

export class FileSystemScanner {

    private readonly fs = vscode.workspace.fs;

    constructor(
        private readonly projectUri: vscode.Uri
    ) {
    }

    /**
     * Get element templates from the current working directory
     */
    public getElementTemplates(): Thenable<Array<JSON>> {
        const uri = vscode.Uri.joinPath(this.projectUri, 'element-templates');
        return this.getResultAsJson(this.readFile(uri));
    }

    /**
     * Get forms from the current working directory
     */
    public getForms(): Thenable<Awaited<[string, JSON]>[]> {
        const uri = vscode.Uri.joinPath(this.projectUri, 'forms');
        return this.getResultAsJson(this.readFile(uri))
            .then((results) => {
                let map = new Map<string, JSON>();
                results.forEach((result) => {
                    const tmp = JSON.stringify(result);
                    if(tmp.includes('{"key":"')) {
                        const start = tmp.indexOf('{"key":"') + 8;
                        const end = tmp.indexOf('","schema":{"type":');
                        map.set(tmp.substring(start, end), result);
                    }
                });
                return Promise.all(map);
            });
    }



//     -----------------------------HELPERS-----------------------------     \\

    /**
     * Converts the content of a thenable from string to json
     * @param thenable The thenable whose results are to be converted to json
     * @returns Thenable with an array of json objects
     * @private
     */
    private getResultAsJson(thenable: Thenable<Awaited<string>[]>): Thenable<Array<JSON>> {
        return thenable
            .then((results) => {
                const elementTemplates: Array<JSON> = [];
                results.forEach((result) => {
                    elementTemplates.push(JSON.parse(result));
                });
                return elementTemplates;
            });

    }

    /**
     * Read files and returns their content as a Thenable
     * @param directory Path where the files are
     * @returns Thenable with the content of the read files
     * @private
     */
    private readFile(directory: vscode.Uri): Thenable<Awaited<string>[]> {
        return this.fs.readDirectory(directory)
            .then((files) => {
                const promises: Array<Thenable<string>> = [];
                files.forEach((file) => {
                    const fileUri = vscode.Uri.joinPath(directory, file[0]);
                    promises.push(this.fs.readFile(fileUri)
                        .then((content) => {
                            return Buffer.from(content).toString('utf-8');
                        }));
                });
                return Promise.all(promises);
            });
    }
}