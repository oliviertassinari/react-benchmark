import WebpackDevServer from 'webpack-dev-server';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';

const webpackConfig = {
  entry: './src/index.js',
  output: {
    path: '/',
    filename: 'bundle.js'
  },
  plugins: [
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new HtmlWebpackPlugin({
      template: './src/index.html'
    }),
    new webpack.DefinePlugin({
      // 'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    // new webpack.optimize.UglifyJsPlugin({
    //   compress: {
    //     warnings: false,
    //     screw_ie8: true,
    //     // unsafe: true,
    //     // unsafe_comps: true,
    //     // pure_getters: true,
    //   },
    //   output: {
    //     comments: false,
    //   },
    // }),
  ],
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules\/(?!@doctolib)/,
        query: {
          presets: ['es2015', 'react', 'stage-1'],
          plugins: [
            'transform-runtime',
            // 'transform-react-remove-prop-types',
            // 'transform-react-constant-elements',
            // 'transform-react-inline-elements',
          ],
          cacheDirectory: false,
        },
      },
      {
        test: /\.scss$/,
        loaders: ['style', 'css', 'sass']
      }
    ]
  }
};

const server = new WebpackDevServer(webpack(webpackConfig), {
  // webpack-dev-server options
  hot: true,
  historyApiFallback: false,

  // webpack-dev-middleware options
  quiet: false,
  noInfo: false,
  filename: 'bundle.js',
  watchOptions: {
    aggregateTimeout: 300,
    poll: 1000,
  },
  stats: {
    modules: false,
    chunks: false,
    chunkModules: false,
    colors: true
  },
});

server.listen(8001, 'localhost', () => {});
