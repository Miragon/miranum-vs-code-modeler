# VS Code BPMN Modeler

### Project structure
```
.
├── LICENSE
├── README.md
├── examples
│   └── test.bpmn
├── package.json
├── resources
│   ├── css
│   │   ├── app.css
│   │   └── reset.css
│   └── js
│       └── app.js
├── src
│   ├── BpmnModeler.ts
│   ├── extension.ts
│   ├── test
│   └── types
│       └── VSCodeApi.ts
├── tsconfig.json
└── webpack.config.js
```

### Quickstart
```shell
git clone https://github.com/FlowSquad/vs-code-bpmn-modeler.git
cd vs-code-bpmn-modeler
```
```shell
npm install
```
```shell
code .
```
Open `Extension Host` with `F5` and open the example folder.

##### For development run
```shell
npm run webpack-dev
```