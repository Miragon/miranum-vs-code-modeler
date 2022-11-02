export type VsCode = {
    postMessage(message: VscMessage): void;
    getState(): VscState;
    setState(state: VscState): void;
};

type VscMessage = {
    type: string;
    content: string;
    files: Array<JSON>;
};

type VscState = {
    text: string;
    elTemplates: string;
    forms: string;
};