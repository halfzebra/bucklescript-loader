const path = require('path');
const {readFile} = require('fs');
const {spawn} = require('cross-spawn');
const bsb = require.resolve('bs-platform/bin/bsb');
const os = require('os');

function getConfig(context) {
  return new Promise((resolve, reject) => {
    readFile(path.resolve(context, 'bsconfig.json'), 'utf8', (err, data) => {
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
  const {context} = this.options;

  if (!callback) {
    throw 'bucklescript-loader currently only supports async mode.';
  }

  console.log(this.context);

  getConfig(context)
    .then(bsconfigJson => {
      let bsconfig;
      try {
        bsconfig = JSON.parse(bsconfigJson)
      } catch (err) {
        return Promise.reject(new Error(`Failed to parse bsconfig.json in ${context}`))
      }
      return Promise.resolve(bsconfig);
    })
    .then(bsconfig => {

      let output = '';
      let err = '';

      console.log(bsconfig);

      //this.addContextDependency(path.join(context, bsconfig.sources.dir));

      const compiler = spawn(bsb, ['-make-world'], {stdio: 'pipe', cwd: context});

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

        let filePath = path.join(
          context,
          '/lib/js/',
          `${this.resourcePath.replace(context, '').replace(/\.(re|ml)$/, '')}.js`
        );

        readFile(
          filePath,
          'utf8',
          (err, data) => {
            console.log(filePath)
            console.log(data)
            callback(err, data)
          }
        );
      });
    })
    .catch(err => {
      console.log('HERE:', err)
      this.emitError(new Error(err));
      callback(err, null);
    });
};
