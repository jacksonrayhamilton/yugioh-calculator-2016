'use strict';

var _ = require('lodash');
var compression = require('compression');
var connect = require('connect');
var fs = require('fs');
var http = require('http');
var ms = require('ms');
var path = require('path');
var spdy = require('spdy');
var serveStatic = require('serve-static');
var url = require('url');

var createServer = function (options) {
  options = options === undefined ? {} : options;
  options.dirs = options.dirs === undefined ? [] : options.dirs;
  options.cache = options.cache === undefined ? false : options.cache;
  var staticAssets = options.staticAssets === undefined ? [] : options.staticAssets;

  var app = connect();

  app.use(compression());

  var setCustomCacheControl = function (res, filePath) {
    if (_.includes(staticAssets, path.relative('.', filePath))) {
      // Custom Cache-Control for HTML files
      res.setHeader('Cache-Control', 'public, max-age=' + (ms('1 year') / 1000));
    }
  };

  _.forEach(options.dirs, function (dir) {
    var baseOptions = options.cache ? {
      maxAge: '1 hour',
      setHeaders: setCustomCacheControl
    } : {};
    var serveSeparate = serveStatic(dir, _.defaults({
      index: 'index.separate.html'
    }, baseOptions));
    var serveCombined = serveStatic(dir, _.defaults({
      index: 'index.combined.html'
    }, baseOptions));
    app.use(function (req, res, next) {
      if (req.isSpdy) {
        serveSeparate(req, res, next);
      } else {
        serveCombined(req, res, next);
      }
    });
  });

  spdy.createServer({
    // These files could be symlinks e.g. to
    // `/etc/letsencrypt/live/example.com/*.pem`
    key: fs.readFileSync('certs/server.key'),
    cert: fs.readFileSync('certs/server.crt'),
    ca: fs.readFileSync('certs/ca.crt')
  }, app).listen(options.httpsPort);

  http.createServer(function (req, res) {
    var parsed = url.parse('http://' + req.headers['host']);
    var host = parsed.hostname;
    if (options.httpsPort !== 443) {
      host += ':' + options.httpsPort;
    }
    res.writeHead(301, {'Location': 'https://' + host + req.url});
    res.end();
  }).listen(options.httpPort);
};

module.exports = createServer;
