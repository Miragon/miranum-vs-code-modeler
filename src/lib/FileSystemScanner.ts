import * as vscode from "vscode";
import {TextDecoder} from "util";
import {Workspace} from "../types";

/**
 * Scan the current working directory for important files.
 */
export class FileSystemScanner {

    private readonly fs = vscode.workspace.fs;

    constructor(
        private readonly projectUri: vscode.Uri,
        private readonly workspaceFolder: Workspace
    ) {
    }

    /**
     * Get all available files.
     */
    public getAllFiles(): Thenable<Array<PromiseSettledResult<Awaited<Thenable<JSON[]> | Thenable<string[]>>>>> {
        return this.fs.readDirectory(this.projectUri)
            .then((result) => {
                const promises: Array<Thenable<JSON[]> | Thenable<string[]>> = [];
                result.forEach((directory) => {
                    if (directory[1] === vscode.FileType.Directory) {
                        // Which directories are available?
                        switch (directory[0]) {
                            case this.workspaceFolder.processConfigs: {
                                // promises.push(this.getConfigs());
                                break;
                            }
                            case this.workspaceFolder.elementTemplates: {
                                promises.push(this.getElementTemplates());
                                break;
                            }
                            case this.workspaceFolder.forms: {
                                promises.push(this.getForms());
                                break;
                            }
                        }
                    }
                });
                return Promise.allSettled(promises);
            }, () => {
                return Promise.reject('No directories found!');
            });
    }

    /**
     * Get element templates from the current working directory
     */
    public getElementTemplates(): Thenable<JSON[]> {
        const uri = vscode.Uri.joinPath(this.projectUri, 'element-templates');
        return this.readFile(uri, 'json')
            .then((result) => {
                return this.getResultsAsJson(result);
            });
    }

    /**
     * Get forms from the current working directory
     */
    public getForms(): Thenable<string[]> {
        const uri = vscode.Uri.joinPath(this.projectUri, 'forms');
        return this.readFile(uri, 'form')
            .then((result) => {
                return this.getFormKeys(result);
            });
    }



//     -----------------------------HELPERS-----------------------------     \\

    /**
     * Converts the content of a thenable from string to json
     * @returns an array of json objects
     * @private
     * @param fileContent
     */
    private getResultsAsJson(fileContent: string[]): JSON[] {
        const fileContentAsJson: JSON[] = [];
        fileContent.forEach((content) => {
            try {
                fileContentAsJson.push(JSON.parse(content));
            } catch (error) {
                console.log('FileSystemScanner:', error);
            }
        });
        return fileContentAsJson;
    }

    /**
     * searches for all form keys from the given files
     * @returns a string array, with all form Keys
     * @private
     * @param fileContent
     */
    private getFormKeys(fileContent: string[]): string[] {
        const formKeys: string[] = [];
        fileContent.forEach((content) => {
            const substr = content.replace(/\s/g, '').match(/{"key":"[A-Za-z0-9_.-]+","schema":{/g);
            if (substr) {
                const key = substr[0];
                const start = 8;
                const end = key.indexOf('","schema":{');
                formKeys.push(key.substring(start, end));
            }
        });
        return formKeys;
    }

    /**
     * Read files and returns their content as a Thenable
     * @param directory Path where the files are
     * @param fileExtension File extension of the files we want to read
     * @returns Thenable with the content of the read files
     * @private
     */
    private async readFile(directory: vscode.Uri, fileExtension: string): Promise<Awaited<string>[]> {
        const results = await this.fs.readDirectory(directory);
        const promises: Array<Thenable<string>> = [];
        results.forEach((result) => {
            if (result[1] === vscode.FileType.File) {   // only files
                const regExp = /(?:\.([^.]+))?$/;
                const extension = regExp.exec(result[0]);
                if (extension && extension[1] === fileExtension) {
                    const fileUri = vscode.Uri.joinPath(directory, result[0]);
                    const file = this.fs.readFile(fileUri);
                    promises.push(file.then((content) => {
                            return Buffer.from(content).toString('utf-8');
                        }));
                }
            }
        });

        return Promise.all(promises);


        /*
        return this.fs.readDirectory(directory)
            .then((results) => {
                const promises: Array<Thenable<string>> = [];
                results.forEach((result) => {
                    if (result[1] === vscode.FileType.File) {   // only files
                        const regExp = /(?:\.([^.]+))?$/;
                        const extension = regExp.exec(result[0]);
                        if (extension && extension[1] === fileExtension) {
                            const fileUri = vscode.Uri.joinPath(directory, result[0]);
                            promises.push(this.fs.readFile(fileUri)
                                .then((content) => {
                                    return Buffer.from(content).toString('utf-8');
                                }));
                        }
                    }
                });
                return Promise.all(promises);
            }, (reason) => {
                console.log('FileSystemScanner:', directory.toString(), 'not found!');
                return Promise.reject(reason);
            });
         */
    }
}