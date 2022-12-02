import exp = require("constants");

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

export type Workspace = {
    processConfigs: string;
    elementTemplates: string;
    forms: string;
};

export type ThenableFiles = Array<{
        type: string,
        value: Thenable<JSON[]> | Thenable<string[]>
    }>;
export type Files = Array<{
        type: string,
        value: JSON[] | string[]
    }>;