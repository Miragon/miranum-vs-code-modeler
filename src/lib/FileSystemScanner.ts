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
        return this.getResultsAsJson(this.readFile(uri));
    }

    /**
     * Get forms from the current working directory
     */
    public getForms(): Thenable<Array<string>> {
        const uri = vscode.Uri.joinPath(this.projectUri, 'forms');
        return this.getFormKeys(this.readFile(uri));
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
                    const file = result.replace(/\s/g, '');
                    if(file.includes('{"key":"')) {
                        const start = file.indexOf('{"key":"') + 8;
                        const end = file.indexOf('","schema":{"type":');
                        formKeys.push(file.substring(start, end));
                    }
                });
                return formKeys;
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