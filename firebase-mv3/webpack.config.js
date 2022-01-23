const path = require('path');
 
module.exports = {
  mode: 'development', //change this to production
  entry: './src/index.js',
  devtool: 'cheap-module-source-map',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  }
}
