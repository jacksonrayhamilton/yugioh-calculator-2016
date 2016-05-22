'use strict';

var createServer = require('./create-server');
var nopt = require('nopt');

var parsed = nopt({
  'http-port': Number,
  'https-port': Number
});

createServer({
  dirs: ['build'],
  cache: true,
  httpPort: parsed['http-port'] === undefined ? 80 : parsed['http-port'],
  httpsPort: parsed['https-port'] === undefined ? 443 : parsed['https-port']
});
