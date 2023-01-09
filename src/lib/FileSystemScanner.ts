import * as vscode from "vscode";
import {FilesContent, Workspace} from "../types";

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
    public async getAllFiles(): Promise<FilesContent> {
        const promises: Array<Promise<JSON[]> | Promise<string[]>> = [];
        promises.push(this.getConfigs());           // index = 0
        promises.push(this.getElementTemplates());  // index = 1
        promises.push(this.getForms());             // index = 2

        return Promise.allSettled(promises)
            .then((results) => {
                const filesContent: FilesContent = {
                    configs: [],
                    elementTemplates: [],
                    forms: []
                };
                results.forEach((result, index) => {
                    if (result.status === 'fulfilled') {
                        switch (index) {
                            case 0: {
                                filesContent.configs = result.value;
                                break;
                            }
                            case 1: {
                                filesContent.elementTemplates = result.value;
                                break;
                            }
                            case 2: {
                                filesContent.forms = result.value;
                                break;
                            }
                        }
                    }
                });
                return filesContent;
            });
    }

    /**
     * Get forms from the current working directory
     * @returns a promise with an array of strings or an empty array
     * @public
     * @async
     */
    public async getForms(): Promise<string[]> {
        const uri = vscode.Uri.joinPath(this.projectUri, this.workspaceFolder.forms);
        const fileContent: string[] = [];
        try {
            const files = await this.readFile(uri, 'form');
            files.forEach((content, path) => {
                try {
                    fileContent.push(this.getFormKey(content));
                } catch (error) {
                    const strSplit = path.split("#");
                    const dir = strSplit[0];
                    const name = strSplit[1];
                    vscode.window.showInformationMessage(
                        'Failed to read form key!' +
                        ' - Folder: ' + dir +
                        ' - File: ' + name +
                        ' - ' + error,
                        ...['Goto file']
                    ).then(() => {
                        const uri = vscode.Uri.joinPath(this.projectUri, dir, name);
                        vscode.window.showTextDocument(
                            uri,
                            {
                                preserveFocus: false,
                                preview: false,
                                viewColumn: vscode.ViewColumn.Active
                            });
                    });
                }
            });

            return Promise.resolve(fileContent);
        } catch (error) {
            return Promise.resolve([]);
        }
    }

    /**
     * Get config files
     * @returns a promise with the content of the config files or an empty array
     * @public
     * @async
     */
    public async getConfigs(): Promise<JSON[]> {
        const uri = vscode.Uri.joinPath(this.projectUri, this.workspaceFolder.configs);
        return this.getFilesAsJson(uri, 'json');
    };

    /**
     * Get element templates
     * @returns a promise with the content of element templates or an empty array
     * @public
     * @async
     */
    public async getElementTemplates(): Promise<JSON []> {
        const uri = vscode.Uri.joinPath(this.projectUri, this.workspaceFolder.elementTemplates);
        return this.getFilesAsJson(uri, 'json');
    }

    /**
     * Get content of json files
     * @returns a promise with an array of json objects or an empty array
     * @private
     * @async
     */
    private async getFilesAsJson(uri: vscode.Uri, fileExt: string): Promise<JSON[]> {
        const fileContent: JSON[] = [];
        try {
            const files = await this.readFile(uri, fileExt);
            files.forEach((content, path) => {
                try {
                    fileContent.push(this.getResultAsJson(content));
                } catch (error) {
                    const strSplit = path.split("#");
                    const dir = strSplit[0];
                    const name = strSplit[1];
                    vscode.window.showInformationMessage(
                        'Failed to read json!' +
                        ' - Folder: ' + dir +
                        ' - File: ' + name +
                        ' - ' + error,
                        ...['Goto file']
                    ).then(() => {
                        const uri = vscode.Uri.joinPath(this.projectUri, dir, name);
                        vscode.window.showTextDocument(
                            uri,
                            {
                                preserveFocus: false,
                                preview: false,
                                viewColumn: vscode.ViewColumn.Active
                            });
                    });
                }
            });

            return Promise.resolve(fileContent);
        } catch (error) {
            return Promise.resolve([]);
        }
    }

    /**
     * Parse given string to a json object
     * @param content the file content
     * @returns a json object
     * @private
     */
    private getResultAsJson(content: string): JSON {
        try {
            return JSON.parse(content);
        } catch (error) {
            throw new Error('getResultAsJson() -> ' + error);
        }
    }

    /**
     * Searches for the form key of a given file
     * @param content the file content
     * @returns the form key as string
     * @private
     */
    private getFormKey(content: string): string {
        const substr = content.replace(/\s/g, '').match(/{"key":"[A-Za-z0-9_.-]+","schema":{/g);
        const substr2 = content.replace(/\s/g, '').match(/{"schema":{.*},"key":"[A-Za-z0-9_.-]+"}/g);
        if (substr) {
            const key = substr[0];
            const start = 8;
            const end = key.indexOf('","schema":{');
            return key.substring(start, end);
        } else if(substr2) {
            const key = substr2[0];
            const start = key.lastIndexOf(`},"key":"`) + 9;
            return key.substring(start, key.length-2);
        } else {
            throw new Error('getFormKey() -> ' + 'Form key could not be found!');
        }
    }

    /**
     * Read files and returns their content
     * @param directory Path to the desired files
     * @param fileExtension File extension of the desired files
     * @returns Promise that resolve to the string value of the read files
     * @private
     * @async
     */
    private async readFile(directory: vscode.Uri, fileExtension: string): Promise<Awaited<Map<string, string>>> {
        const files: Map<string, Thenable<Uint8Array>> = new Map();
        const content: Map<string, string> = new Map();

        const dirRoot = directory.toString().replace(
            this.projectUri.toString(),
            ''
        );

        try {
            const results = await this.fs.readDirectory(directory);
            results.forEach((result) => {
                if (result[1] === vscode.FileType.File) {   // only files
                    const regExp = /(?:\.([^.]+))?$/;
                    const extension = regExp.exec(result[0]);
                    if (extension && extension[1] === fileExtension) {  // only files with given file extension
                        const fileUri = vscode.Uri.joinPath(directory, result[0]);
                        try {
                            files.set(dirRoot + '/#' + result[0], this.fs.readFile(fileUri));
                        } catch (error) {
                            // inform user that a certain file could not be read
                            vscode.window.showInformationMessage(
                                'Could not read file!' +
                                ' - Folder: ' + dirRoot +
                                ' - File: ' + result[0] +
                                ' - ' + error
                            );
                        }
                    }
                }
            });

            const filePaths = Array.from(files.keys());
            const testSettled = await Promise.allSettled(files.values());
            testSettled.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    content.set(
                        filePaths[index],
                        Buffer.from(result.value).toString('utf-8')  // convert Uint8Array to string
                    );
                }
            });

            return Promise.resolve(content);

        } catch (error) {
            return Promise.reject(new Error('readFile() -> ' + error));
        }
    }
}