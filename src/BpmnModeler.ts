import * as vscode from 'vscode';

export class BpmnModeler implements vscode.CustomTextEditorProvider {

    public static readonly viewType = 'bpmn-modeler';

    public static register(context: vscode.ExtensionContext, files: Array<JSON>): vscode.Disposable {
        const provider = new BpmnModeler(context, files);
        return vscode.window.registerCustomEditorProvider(BpmnModeler.viewType, provider);
    }

    public constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly files: Array<JSON>
    ) { }

    /**
     * Called when the custom editor / source file is opened
     * @param document Represents the source file
     * @param webviewPanel Panel that contains the webview
     * @param token Token to cancel asynchronous or long-running operations
     */
    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        token: vscode.CancellationToken): Promise<void>
    {
        let isUpdateFromWebview = false;

        webviewPanel.webview.options = {
            enableScripts: true
        };

        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, this.context.extensionUri);

        webviewPanel.webview.onDidReceiveMessage((event) => {
            switch (event.type) {
                case BpmnModeler.viewType + '.updateFromWebview':
                    isUpdateFromWebview = true;
                    this.updateTextDocument(document, event.content);
            }
        });

        const updateWebview = (type: string) => {
            switch (type) {
                case 'initialCall': {
                    webviewPanel.webview.postMessage({
                        type: BpmnModeler.viewType + '.' + type,
                        text: document.getText(),
                        files: this.files
                    });
                    break;
                }
                case 'updateFromExtension': {
                    webviewPanel.webview.postMessage({
                        type: BpmnModeler.viewType + '.' + type,
                        text: document.getText()
                    });
                    break;
                }
            }
        };

        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument((event) => {
            if (event.document.uri.toString() === document.uri.toString() && event.contentChanges.length !== 0) {
                if (!isUpdateFromWebview) {
                    updateWebview('updateFromExtension');
                }
                isUpdateFromWebview = false;
            }
        });

        webviewPanel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
        });

        updateWebview('initialCall');
    }

    private getHtmlForWebview(webview: vscode.Webview, extensionUri: vscode.Uri) {

        const scriptApp = webview.asWebviewUri(vscode.Uri.joinPath(
            extensionUri, 'dist', 'client', 'client.mjs'
        ));

        const styleReset = webview.asWebviewUri(vscode.Uri.joinPath(
            extensionUri, 'resources', 'css', 'reset.css'
        ));

        const styleApp = webview.asWebviewUri(vscode.Uri.joinPath(
            extensionUri, 'dist', 'client', 'style.css'
        ));

        const fontBpmn = webview.asWebviewUri(vscode.Uri.joinPath(
            extensionUri, 'dist', 'client', 'assets', 'bpmn-font', 'css', 'bpmn.css'
        ));

        const nonce = this.getNonce();

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="utf-8" />

                <meta http-equiv="Content-Security-Policy" content="default-src 'none';
                    style-src ${webview.cspSource} 'unsafe-inline';
                    img-src ${webview.cspSource} data:;
                    font-src ${webview.cspSource};
                    script-src 'nonce-${nonce}';"/>

                <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                
                <link href="${styleReset}" rel="stylesheet" type="text/css" />
                <link href="${styleApp}" rel="stylesheet" type="text/css" />
                <link href="${fontBpmn}" rel="stylesheet" type="text/css" />

                <title>Custom Texteditor Template</title>
            </head>
            <body>
              <div class="content with-diagram" id="js-drop-zone">

                <div class="message error">
                  <div class="note">
                    <p>Ooops, we could not display the BPMN 2.0 diagram.</p>

                    <div class="details">
                      <span>Import Error Details</span>
                      <pre></pre>
                    </div>
                  </div>
                </div>

                <div class="canvas" id="js-canvas"></div>
                <div class="properties-panel-parent" id="js-properties-panel"></div>
              </div>
              
              <script type="text/javascript" src="${scriptApp}" nonce="${nonce}"></script>
            </body>
            </html>
        `;
    }

    private getNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    private updateTextDocument(document: vscode.TextDocument, text: string): Thenable<boolean> {
        const edit = new vscode.WorkspaceEdit();

        edit.replace(
            document.uri,
            new vscode.Range(0, 0, document.lineCount, 0),
            text
        );

        return vscode.workspace.applyEdit(edit);
    }
}