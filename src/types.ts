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

export interface Workspace {
    processConfigs: string;
    elementTemplates: string;
    forms: string;
}

export interface FilesContent {
    configs: JSON[] | string[],
    elementTemplates: JSON[] | string[],
    forms: JSON[] | string[]
}

