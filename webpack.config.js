const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

const PATHS = {
  src: path.join(__dirname, 'src'),
  public: path.join(__dirname, 'public'),
};

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  entry: {
    main: PATHS.src,
  },
  output: {
    path: PATHS.public,
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  devServer: {
    open: true,
    port: 3000,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'index.html',
    }),
  ],
};
