const path = require('path');
const {readFile} = require('fs');
const {spawn} = require('cross-spawn');
const bsb = require.resolve('bs-platform/bin/bsb');
const os = require('os');

const cwd = process.cwd();

function getConfig() {
  return new Promise((resolve, reject) => {
    readFile(path.resolve(cwd, 'bsconfig.json'), 'utf8', (err, data) => {
      if (err) {
        console.log('Error reading bsconfig.json: ', err);
        reject(err);
      }
      resolve(data);
    });
  });
}

module.exports = function () {

  this.cacheable && this.cacheable();

  const callback = this.async();

  if (!callback) {
    throw 'bucklescript-loader currently only supports async mode.';
  }

  getConfig()
    .then(bsconfig => {

      let output = '';
      let err = '';

      const compiler = spawn(bsb, ['-make-world'], {stdio: 'pipe'});

      compiler.stdout.setEncoding('utf8');
      compiler.stdout.on('data', data => {
        output += data;
      });

      compiler.stderr.setEncoding('utf8');
      compiler.stderr.on('data', data => {
        console.log('Error compiling: ', data);
        err += data;
      });

      compiler.on('close', code => {

        console.log('EXIT CODE:', code);
        console.log('STDOUT:', output.replace(/\n/g, os.EOL));

        if (code !== 0) {
          console.log('Error on close:', err);
          this.emitError(new Error(output));
          callback(output, null);
          return;
        }

        console.log(this.resourcePath.replace(cwd, ''));

        readFile(cwd + `/lib/js/${this.resourcePath.replace(cwd, '').replace(/\.(re|ml)$/, '')}.js`, callback);
      });
    })
    .catch(err => {
      this.emitError(new Error(err));
      callback('Read config error', null);
    });
};
