'use strict';

var createServer = require('./create-server');
var fs = require('fs');
var nopt = require('nopt');

var parsed = nopt({
  'http-port': Number,
  'https-port': Number
});

createServer({
  dirs: ['build'],
  cache: true,
  staticAssets: JSON.parse(fs.readFileSync('build/static-assets.json', 'utf8')),
  httpPort: parsed['http-port'] === undefined ? 80 : parsed['http-port'],
  httpsPort: parsed['https-port'] === undefined ? 443 : parsed['https-port']
});
