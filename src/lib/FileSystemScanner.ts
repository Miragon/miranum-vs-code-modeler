import * as vscode from "vscode";
import {FilesContent, WorkspaceFolder} from "../types";
import {Uri} from "vscode";

/**
 * Scan the current working directory for important files.
 */
export class FileSystemScanner {
    private static instance: FileSystemScanner;
    private readonly fs = vscode.workspace.fs;

    private constructor(
        private readonly projectUri: vscode.Uri,
    ) {
    }

    public static createFileSystemScanner(uri: Uri): FileSystemScanner {
        if (this.instance === undefined) {
            this.instance = new FileSystemScanner(uri);
        }
        return this.instance;
    }

    /**
     * Get all available files.
     */
    public async getAllFiles(workspace: WorkspaceFolder[]): Promise<FilesContent[]> {
        const promises: Map<string, Promise<JSON[] | string[]>> = new Map();
        workspace.forEach((folder) => {
            let ext = folder.extension.substring(folder.extension.indexOf('.') + 1);  // substring after first '.'
            switch (folder.type) {
                case 'form': {
                    // special case because we only need the form-keys and not the whole file
                    if (!ext) {
                        ext = 'form';
                    }
                    promises.set(folder.type, this.getForms(folder.path, ext));
                    break;
                }
                default: {
                    if (!ext) {
                        ext = 'json';
                    }
                    promises.set(folder.type, this.getFilesAsJson(folder.path, ext));
                    break;
                }
            }
        });

        const filesContent: FilesContent[] = [];
        const keys: string[] = Array.from(promises.keys());
        const settled = await Promise.allSettled(promises.values());
        settled.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                filesContent.push({
                    type: keys[index],
                    content: result.value
                });
            }
        });

        return Promise.resolve(filesContent);
    }

    /**
     * Get forms from the current working directory
     * @returns a promise with an array of strings or an empty array
     * @public
     * @async
     */
    public async getForms(path: string, extension: string): Promise<string[]> {
        if (!path) {
            return Promise.resolve([]);
        }

        const uri = vscode.Uri.joinPath(this.projectUri, path);
        const fileContent: string[] = [];
        try {
            const files = await this.readFilesOfDir(uri, extension);
            files.forEach((content, path) => {
                try {
                    fileContent.push(this.getFormKey(content));
                } catch (error) {
                    this.showErrorMessage(path, error);
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
    public async getConfigs(path: string, extension: string): Promise<JSON[]> {
        return this.getFilesAsJson(path, extension);
    };

    /**
     * Get element templates
     * @returns a promise with the content of element templates or an empty array
     * @public
     * @async
     */
    public async getElementTemplates(path: string, extension: string): Promise<JSON []> {
        return this.getFilesAsJson(path, extension);
    }

    /**
     * Get content of json files
     * @returns a promise with an array of json objects or an empty array
     * @private
     * @async
     */
    private async getFilesAsJson(path: string, extension: string): Promise<JSON[]> {
        if (!path) {
            return Promise.resolve([]);
        }
        const uri = vscode.Uri.joinPath(this.projectUri, path);

        const fileContent: JSON[] = [];
        try {
            const files = await this.readFilesOfDir(uri, extension);
            files.forEach((content, path) => {
                try {
                    fileContent.push(this.getStringAsJson(content));
                } catch (error) {
                    this.showErrorMessage(path, error);
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
    private getStringAsJson(content: string): JSON {
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
        } else if (substr2) {
            // Todo: Is the key always 9 characters long?
            const key = substr2[0];
            const start = key.lastIndexOf(`},"key":"`) + 9;
            return key.substring(start, key.length - 2);
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
    private async readFilesOfDir(directory: vscode.Uri, fileExtension: string): Promise<Map<string, string>> {
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
                    const extension = result[0].substring(result[0].indexOf('.') + 1);
                    if (extension && extension === fileExtension) {  // only files with given file extension
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
            const settled = await Promise.allSettled(files.values());
            settled.forEach((result, index) => {
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

    private showErrorMessage(path: string, error: unknown) {
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
}