export type VsCode = {
    postMessage(message: VscMessage): void;
    getState(): VscState;
    setState(state: VscState): void;
};

type VscMessage = {
    type: string;
    content: string;
};

type VscState = {
    text: string;
    files: string;
};

export interface FilesContent {
    type: string,
    content: JSON[] | string[]
}

export interface WorkspaceFolder {
    type: string;
    path: string;
    extension: string;
}

export interface WorkspaceContent {
    workspace: WorkspaceFolder[];
    content: FilesContent[];
}
