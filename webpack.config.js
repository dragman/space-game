const webpack = require('webpack');

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === 'development';

  return {
    resolve: {
      extensions: [".ts", ".js"],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: "ts-loader",
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        IS_DEVELOPMENT: JSON.stringify(isDevelopment),
      }),
    ],
  };
};
