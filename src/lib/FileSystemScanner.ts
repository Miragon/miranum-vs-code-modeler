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
    public async getAllFiles(): Promise<Promise<PromiseSettledResult<JSON[] | string[]>[]>> {
        const promises: Array<Promise<JSON[]> | Promise<string[]>> = [];
        try {
            const results = await this.fs.readDirectory(this.projectUri);
            results.forEach((result) => {
                if (result[1] === vscode.FileType.Directory) {
                    // Which directories are available?
                    try {
                        switch (result[0]) {
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
                    } catch (error) {
                        throw new Error('' + error);
                    }
                }
            });

            if (promises.length === 0) {
                throw new Error('No relevant files were found!');
            }

            return Promise.allSettled(promises);

        } catch (error) {
            throw new Error(' getAllFiles() -> ' + error);
        }
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
                throw new Error(' getElementTemplates() -> ' + error);
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
                console.log(' getForms() -> ' + error);
            }
        });

        return Promise.resolve(fileContent);
    }


//     -----------------------------HELPERS-----------------------------     \\

    /**
     * Parse given string to a json object
     * @private
     * @param content
     * @returns a json object
     */
    private getResultAsJson(content: string): JSON {
        try {
            return JSON.parse(content);
        } catch (error) {
            throw new Error(' getResultAsJson() -> ' + error);
        }
    }

    /**
     * Searches for the form key of a given file
     * @private
     * @param content
     * @returns the form key as string
     */
    private getFormKey(content: string): string {
        const substr = content.replace(/\s/g, '').match(/{"key":"[A-Za-z0-9_.-]+","schema":{/g);
        if (substr) {
            const key = substr[0];
            const start = 8;
            const end = key.indexOf('","schema":{');
            return key.substring(start, end);
        } else {
            throw new Error(' getFormKey() -> ' + 'Form key could not be found!');
        }
    }

    /**
     * Read files and returns their content
     * @param directory Path to the desired files
     * @param fileExtension File extension of the desired files
     * @returns Promise that resolve to the string value of the read files
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