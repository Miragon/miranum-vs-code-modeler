import * as vscode from "vscode";

/**
 * Scan the current working directory for important files.
 */
export class FileSystemScanner {

    private readonly fs = vscode.workspace.fs;

    constructor(
        private readonly projectUri: vscode.Uri
    ) {
    }

    /**
     * Get all possible file types.
     */
    public getAllFiles(): Promise<Awaited<Array<JSON> | Array<string>>[]> {
        const thenables = [
            this.getElementTemplates(),
            this.getForms()
        ];
        return Promise.all(thenables);
    }

    /**
     * Get element templates from the current working directory
     */
    public getElementTemplates(): Thenable<Array<JSON>> {
        const uri = vscode.Uri.joinPath(this.projectUri, 'element-templates');
        return this.getResultsAsJson(this.readFile(uri, 'json'));
    }

    /**
     * Get forms from the current working directory
     */
    public getForms(): Thenable<Array<string>> {
        const uri = vscode.Uri.joinPath(this.projectUri, 'forms');
        return this.getFormKeys(this.readFile(uri, 'form'));
    }



//     -----------------------------HELPERS-----------------------------     \\

    /**
     * Converts the content of a thenable from string to json
     * @param thenable The thenable whose results are to be converted to json
     * @returns Thenable with an array of json objects
     * @private
     */
    private getResultsAsJson(thenable: Thenable<Awaited<string>[]>): Thenable<Array<JSON>> {
        return thenable
            .then((results) => {
                const files: Array<JSON> = [];
                results.forEach((result) => {
                    files.push(JSON.parse(result));
                });
                return files;
            });
    }

    /**
     * searches for all form keys from the given files
     * @param thenable The thenable whose result is to be filtered
     * @returns a string array, with all form Keys
     * @private
     */
    private getFormKeys(thenable: Thenable<Awaited<string>[]>): Thenable<Array<string>> {
        return thenable
            .then((files) => {
                const formKeys = new Array<string>;
                files.forEach((result) => {
                    const substr = result.replace(/\s/g, '').match(/{"key":"[A-Za-z0-9_.-]+","schema":{/g);
                    if (substr) {
                        const key = substr[0];
                        const start = 8;
                        const end = key.indexOf('","schema":{');
                        formKeys.push(key.substring(start, end));
                    }
                });
                return formKeys;
            });
    }

    /**
     * Read files and returns their content as a Thenable
     * @param directory Path where the files are
     * @param fileExtension File extension of the files we want to read
     * @returns Thenable with the content of the read files
     * @private
     */
    private readFile(directory: vscode.Uri, fileExtension: string): Thenable<Awaited<string>[]> {
        return this.fs.readDirectory(directory)
            .then((files) => {
                const promises: Array<Thenable<string>> = [];
                files.forEach((file) => {
                    const regExp = /(?:\.([^.]+))?$/;
                    const extension = regExp.exec(file[0]);
                    if (extension && extension[1] === fileExtension && file[1] === vscode.FileType.File) {
                        const fileUri = vscode.Uri.joinPath(directory, file[0]);
                        promises.push(this.fs.readFile(fileUri)
                            .then((content) => {
                                return Buffer.from(content).toString('utf-8');
                            }));
                    }
                });
                return Promise.all(promises);
            });
    }
}