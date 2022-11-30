# VS Code BPMN Modeler

### Project structure
```
.
├── LICENSE
├── README.md
├── examples
├── package.json
├── tsconfig.json
├── resources
│   └── css
│       └── reset.css
├── src
│   ├── BpmnModeler.ts
│   ├── extension.ts
│   ├── lib
│   ├── test
│   └── types
└── web
    ├── src
    │   ├── app.css
    │   ├── app.js
    │   └── index.html
    ├── PropertieProvider
    │   ├── descriptor
    │   └── provider
    │      ├── parts
    │      ├── index.js
    │      └── MiragonProvider.js
    ├── tsconfig.json
    └── vite.config.js
```

### Quickstart
```shell
git clone https://github.com/FlowSquad/vs-code-bpmn-modeler.git
cd miranum-bpmn-modeler
```
```shell
npm install
npm run web
```
```shell
code .
```
Open `Extension Host` with `F5` and open the example folder.

### Development
The `web folder` contains the necessary files for building the webapp we use later for our webview.  
So it is possible to develop the webview detached from the extension.  
For bundling the webview we use `vite`.  
**During development use `npm run web-dev` and the index.html under `web/src/`.**

Does the webapp meet your requirements adjust your webviews html content.  
Extend your webapp, so it can communicate with your extension by using the `aquireVsCodeAPI`.  
For debugging your extension use `F5` inside vscode.  