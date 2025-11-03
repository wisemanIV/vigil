const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const fs = require('fs');

module.exports = {
  mode: 'production',
  entry: {
    background: './src/background.js',
    content: './src/content.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
    globalObject: 'self'
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        ...(fs.existsSync('icons') ? [{ from: 'icons', to: 'icons' }] : []),
        // Copy PDF.js worker
        {
          from: 'node_modules/pdfjs-dist/build/pdf.worker.js',
          to: 'pdf.worker.js'
        }
      ]
    })
  ],
  resolve: {
    fallback: {
      "crypto": false,
      "stream": false,
      "util": false,
      "fs": false,
      "path": false
    }
  },
  module: {
    rules: [
      {
        test: /\.worker\.js$/,
        use: { loader: 'worker-loader' }
      }
    ]
  }
};
