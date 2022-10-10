import * as vscode from 'vscode';

export class BpmnModeler implements vscode.CustomTextEditorProvider {

    public static readonly viewType = 'bpmn-modeler';

    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new BpmnModeler(context);
        return vscode.window.registerCustomEditorProvider(BpmnModeler.viewType, provider);
    }

    private skipNextUpdatePush = false;

    public constructor(
        private readonly context: vscode.ExtensionContext
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
        token: vscode.CancellationToken
    ): Promise<void> {
        webviewPanel.webview.options = {
            enableScripts: true
        };

        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, this.context.extensionUri);

        webviewPanel.webview.onDidReceiveMessage((event) => {
            switch (event.type) {
                case 'updateFromWebview':
                    this.updateTextDocument(document, event.content);
            }
        });

        function updateWebview() {
            webviewPanel.webview.postMessage({
                type: 'updateFromExtension',
                text: document.getText()
            });
        }
        function loadXML() {
            webviewPanel.webview.postMessage({
                type: 'loadXML',
                text: document.getText()
            });
        }

        vscode.workspace.onWillSaveTextDocument(() => {
            // If the save comes from the document itself, do not send an update message
            this.skipNextUpdatePush = true;
        });

        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument((event) => {
            if (event.document.uri.toString() === document.uri.toString() && event.contentChanges.length !== 0) {
                updateWebview();
            }
        });

        webviewPanel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
        });

        webviewPanel.webview.onDidReceiveMessage((e) => {
            switch (e.type) {
              case "updateXML":
                this.updateTextDocument(document, e.text);
                return;
            }
          });

        loadXML();
        updateWebview();
    }

    private getHtmlForWebview(webview: vscode.Webview, extensionUri: vscode.Uri) {

        const scriptModeler = webview.asWebviewUri(vscode.Uri.joinPath(
            extensionUri, 'dist', 'resources', 'js', 'app.js'
        ));

        const styleReset = webview.asWebviewUri(vscode.Uri.joinPath(
            extensionUri, 'dist', 'resources', 'css', 'reset.css'
        ));

        const styleModeler = webview.asWebviewUri(vscode.Uri.joinPath(
            extensionUri, 'dist', 'resources', 'css', 'app.css'
        ));

        const styleDiagram = webview.asWebviewUri(vscode.Uri.joinPath(
            extensionUri, 'dist', 'resources', 'css', 'assets', 'diagram-js.css'
        ));

        const styleBpmn = webview.asWebviewUri(vscode.Uri.joinPath(
            extensionUri, 'dist', 'resources', 'css', 'assets', 'bpmn-js.css'
        ));

        const fontBpmn = webview.asWebviewUri(vscode.Uri.joinPath(
            extensionUri, 'dist', 'resources', 'css', 'assets', 'bpmn-font', 'css', 'bpmn.css'
        ));

        const nonce = this.getNonce();

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="utf-8" />

                <meta http-equiv="Content-Security-Policy" content="default-src 'none';
                    style-src ${webview.cspSource} 'unsafe-inline';
                    font-src ${webview.cspSource};
                    script-src 'nonce-${nonce}';"/>

                <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                
                <link href="${styleReset}" rel="stylesheet" type="text/css" />
                <link href="${styleModeler}" rel="stylesheet" type="text/css" />
                <link href="${styleDiagram}" rel="stylesheet" type="text/css" />
                <link href="${styleBpmn}" rel="stylesheet" type="text/css" />
                <link href="${fontBpmn}" rel="stylesheet" type="text/css" />

                <title>Custom Texteditor Template</title>

            </head>
            <body>
                <div class="canvas" id="js-canvas"></div>
              
                <script type="text/javascript" src="${scriptModeler}" nonce="${nonce}"></script>
            </body>
            </html>
        `;
    }
    //<div class="properties-panel-parent" id="js-properties-panel"></div>

    /*
                <div class="content" id="js-drop-zone">

                    <div class="message intro">
                      <div class="note">
                        Drop BPMN diagram from your desktop or <a id="js-create-diagram" href>create a new diagram</a> to get started.
                      </div>
                    </div>

                    <div class="message error">
                      <div class="note">
                        <p>Ooops, we could not display the BPMN 2.0 diagram.</p>

                        <div class="details">
                          <span>cause of the problem</span>
                          <pre></pre>
                        </div>
                      </div>
                    </div>

                    <div class="canvas" id="js-canvas"></div>
                </div>
    */

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