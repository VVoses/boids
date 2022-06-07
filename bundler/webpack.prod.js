const { merge } = require('webpack-merge');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
// eslint-disable-next-line import/extensions
const commonConfiguration = require('./webpack.common.js');

module.exports = merge(
  commonConfiguration,
  {
    mode: 'production',
    plugins:
        [
          new CleanWebpackPlugin(),
        ],
  },
);
