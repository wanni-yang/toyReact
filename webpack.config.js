module.exports = {
    entry:{
        main:'./main.js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                        plugins: [['@babel/plugin-transform-react-jsx', { pragma: 'createElement' }]]
                    }
                }

            }
        ]
    },
    resolve: {
        fallback: {
            "util": false,
            "path": false,
            "crypto": false,
            "https": false,
            "http": false,
            "vm": false,
            "os": false,
            "fs": false,
            "buffer": false,
            "stream": false,
            "worker_threads": false,
            "child_process": false,
            "constants": false,
            "assert": false,
            "pnpapi": false,
        }
    },
    mode: "development",
    optimization: {
        minimize: false
    }
}