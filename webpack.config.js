const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: {
        modeler: ['./resources/js/app.js'],
        '../extension': ['./src/extension.ts']
    },
    output: {
        path: __dirname + '/dist/public',
        filename: '[name].js',
        libraryTarget: "commonjs2",
        devtoolModuleFilenameTemplate: "../[resource-path]"
    },
    target: 'webworker',
    devtool: 'source-map',
    resolve: {
        mainFields: ['browser', 'module', 'main'],
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "ts-loader"
                    }
                ]
            }
        ]
    },
    externals: {
        vscode: 'commonjs vscode'
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                {from: 'assets/**', to: 'vendor/bpmn-js', context: 'node_modules/bpmn-js/dist/'},
                {from: '**/*.{html,css}', context: 'resources/'},
            ],
        })
    ]
};
