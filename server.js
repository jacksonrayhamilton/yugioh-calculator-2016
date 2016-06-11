/* eslint-env node */

'use strict';

var _ = require('lodash');
var compression = require('compression');
var connect = require('connect');
var fs = require('fs');
var http = require('http');
var https = require('spdy');
var ms = require('ms');
var nopt = require('nopt');
var path = require('path');
var serveStatic = require('serve-static');
var url = require('url');

var dir = 'build';
var staticAssets = JSON.parse(fs.readFileSync('config/static.json', 'utf8'));

var options = nopt({
  'http-port': Number,
  'https-port': Number
});

var httpPort = options['http-port'] === undefined ? 80 : options['http-port'];
var httpsPort = options['https-port'] === undefined ? 443 : options['https-port'];

var app = connect();

app.use(compression());

var setCustomCacheControl = function (res, filePath) {
  // Cache known immutable files for much longer.
  if (_.includes(staticAssets, path.relative('.', filePath))) {
    res.setHeader('Cache-Control', 'public, max-age=' + (ms('1 year') / 1000));
  }
};

app.use(serveStatic(dir, {
  maxAge: '1 hour',
  setHeaders: setCustomCacheControl
}));

https.createServer({
  // These files could be symlinks e.g. to
  // `/etc/letsencrypt/live/example.com/*.pem`
  key: fs.readFileSync('certs/server.key'),
  cert: fs.readFileSync('certs/server.crt'),
  ca: fs.readFileSync('certs/ca.crt')
}, app).listen(httpsPort);

http.createServer(function (req, res) {
  // Redirect to https, even when the https port is not 443.
  var parsed = url.parse('http://' + req.headers['host']);
  var host = parsed.hostname;
  if (httpsPort !== 443) {
    host += ':' + httpsPort;
  }
  res.writeHead(301, {'Location': 'https://' + host + req.url});
  res.end();
}).listen(httpPort);
