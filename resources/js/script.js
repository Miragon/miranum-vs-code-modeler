(function () {
    // Store the VsCodeAPI in a global variable, so we can use it inside the Vue-App
    const vscode = acquireVsCodeApi();
    let text = '';

    const state = vscode.getState();
    if (state) {
        text = state.text;
    }

    // Get the initial state of the webview
    const container = /** @type {HTMLDivElement} */ (document.getElementById('app'));

    // Set initial text to textarea
    const textarea = document.createElement('textarea');
    textarea.value = text;
    container.appendChild(textarea);

    // Send text back to extension
    const submit = document.createElement('button');
    submit.innerHTML = 'Submit';
    submit.addEventListener('click', () => {
        vscode.postMessage({
            type: 'updateFromWebview',
            content: textarea.value
        });
    });
    container.appendChild(submit);

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', (event) => {
        const message = event.data;
        switch (message.type) {
            case 'updateFromExtension':
                const text = message.text;
                textarea.value = text; // set current content
                vscode.setState({
                    text: text
                });
                return;
        }
    });
}());
