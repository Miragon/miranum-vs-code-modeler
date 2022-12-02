import * as vscode from "vscode";
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
    public async getElementTemplates(): Promise<JSON[]> {
        const uri = vscode.Uri.joinPath(this.projectUri, this.workspaceFolder.elementTemplates);
        const files = await this.readFile(uri, 'json');
        const fileContent: JSON[] = [];
        files.forEach((file) => {
            try {
                fileContent.push(this.getResultAsJson(file));
            } catch (error) {
                console.log('FileSystemScanner.getElementTemplates() -> ' + error);
            }
        });

        return Promise.resolve(fileContent);
    }

    /**
     * Get forms from the current working directory
     */
    public async getForms(): Promise<string[]> {
        const uri = vscode.Uri.joinPath(this.projectUri, 'forms');
        const files = await this.readFile(uri, 'form');
        const fileContent: string[] = [];
        files.forEach((file) => {
            try {
                fileContent.push(this.getFormKey(file));
            } catch (error) {
                console.log('FileSystemScanner.getForms() -> ' + error);
            }
        });

        return Promise.resolve(fileContent);
    }


//     -----------------------------HELPERS-----------------------------     \\

    /**
     * Converts the content of a thenable from string to json
     * @returns an array of json objects
     * @private
     * @param content
     */
    private getResultAsJson(content: string): JSON {
        try {
            return JSON.parse(content);
        } catch (error) {
            throw new Error('FileSystemScanner.getResultAsJson() -> ' + error);
        }
    }

    /**
     * searches for all form keys from the given files
     * @returns a string array, with all form Keys
     * @private
     * @param content
     */
    private getFormKey(content: string): string {
        const substr = content.replace(/\s/g, '').match(/{"key":"[A-Za-z0-9_.-]+","schema":{/g);
        if (substr) {
            const key = substr[0];
            const start = 8;
            const end = key.indexOf('","schema":{');
            return key.substring(start, end);
        } else {
            throw new Error('FileSystemScanner.getFormKey() -> ' + 'Form key could not be found!');
        }
    }

    /**
     * Read files and returns their content as a Thenable
     * @param directory Path where the files are
     * @param fileExtension File extension of the files we want to read
     * @returns Thenable with the content of the read files
     * @private
     */
    private async readFile(directory: vscode.Uri, fileExtension: string): Promise<Awaited<string>[]> {
        const promises: Array<Thenable<string>> = [];

        /** TODO What should happen if one file creates an error? */

        const results = await this.fs.readDirectory(directory);
        results.forEach((result) => {
            if (result[1] === vscode.FileType.File) {   // only files
                const regExp = /(?:\.([^.]+))?$/;
                const extension = regExp.exec(result[0]);
                if (extension && extension[1] === fileExtension) {  // only files with given file extension
                    const fileUri = vscode.Uri.joinPath(directory, result[0]);
                    const file = this.fs.readFile(fileUri);
                    promises.push(file.then((content) => {
                        return Buffer.from(content).toString('utf-8');  // convert Uint8Array to string
                    }));
                }
            }
        });

        return Promise.all(promises);
    }
}