module.exports = {
  mode: "production",
  entry: "./index.js",
  output: {
    filename: "abi-decoder.js",
    libraryTarget: "var",
    library: "abiDecoder",
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader",
      },
    ],
  },
};
