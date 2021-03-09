const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
// const MiniCssExtractPlugin = require('mini-css-extract-plugin');

// const isDev = process.env.NODE_ENV === 'development';
// const isProd = !isDev;

module.exports = {
  context: path.resolve(__dirname, 'src'),
  entry: './js/main.js',
  output: {
    filename: './js/main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  devServer: {
    historyApiFallback: true,
    contentBase: path.resolve(__dirname, 'dist'),
    open: true,
    compress: true,
    hot: true,
    port: 3000,
  },
  module: {
    rules: [
      {
        test: /\.html$/,
        loader: 'html-loader',
      },
      // [{ test: /\.txt$/, use: 'raw-loader' }],
      /* {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      }, */
      // {
      //   test: /\.css$/i,
      //   use: [
      //     MiniCssExtractPlugin.loader,
      //     {
      //       loader: 'css-loader',
      //       options: {
      //         sourceMap: true,
      //       },
      //     },
      //   ],
      // },
      { test: /\.css$/, use: ['style-loader', 'css-loader', 'postcss-loader'] },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
    ],
  },
  plugins: [
    // new MiniCssExtractPlugin({
    //   filename: '[name].css',
    // }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/index.html'),
      filename: 'index.html',
    }),
  ],
};
