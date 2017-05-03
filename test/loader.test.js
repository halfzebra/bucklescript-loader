const fs = require('fs');
const path = require('path');
const ava = require('ava');
const webpack = require('webpack');

const bucklescriptLoader = require.resolve('../src');
const fixturePath = path.resolve(__dirname, 'fixtures/basic');
const output = path.resolve(fixturePath, './output');

const config = {
  context: fixturePath,
  entry: './src/basic.re',
  output: {
    path: output
  },
  module: {
    loaders: [
      {
        test: /\.re?/,
        loader: bucklescriptLoader,
        exclude: /node_modules/,
      }
    ]
  }
};

ava.cb('should transpile the code snippet', t => {

  webpack(config, (err) => {

    t.is(err, null);

    fs.readdir(output, (err, files) => {
      t.is(err, null);
      t.true(files.length === 1);
      fs.readFile(path.resolve(output, files[0]), (err, data) => {
        t.is(err, null);
        const test = 'var message = "Hello World!";';
        const subject = data.toString();

        t.not(subject.indexOf(test), -1);

        t.end();
      });
    });
  });
});
