#!/usr/bin/env node

// Generates an nginx manifest file to set high cache headers on particular
// static assets.  In order for it to take effect, add the following to the
// nginx server block (before any other regular expression rules, because it
// will take precedence):
//
//   include /var/www/yugiohcalculator.com/manifest.conf;

/* eslint-env node */
/* eslint-disable no-console */

import fs from 'fs';

function isEmpty (collection) {
  return collection.length === 0;
}

// Get all values of all own properties of an object.
function objectValues (object) {
  return Object.keys(object).reduce(function (values, key) {
    return values.concat([object[key]]);
  }, []);
}

// Escape regular expression metacharacters in a string.
var regExpCharPattern = new RegExp('[.*+?^${}()|[\\]\\\\]', 'g');
function escapeRegExp (string) {
  return string.replace(regExpCharPattern, '\\$&'); // $& means the whole matched string
}

// Parse the manifest JSON generated by a build tool.
function getHashedFiles (manifestJsonPath) {
  if (!manifestJsonPath) {
    throw new Error('Missing required manifest JSON input path');
  }

  var manifestJsonText;
  try {
    manifestJsonText = fs.readFileSync(manifestJsonPath, 'utf8');
  } catch (error) {
    throw new Error('Manifest JSON not found: ' + error);
  }

  var manifestJson;
  try {
    manifestJson = JSON.parse(manifestJsonText);
  } catch (error) {
    throw new Error('Manifest JSON malformed: ' + error);
  }

  return objectValues(manifestJson);
}

// Generate an nginx location block matching `files` exactly, optionally
// allowing CORS if `cors` is passed.
function getNginxLocationBlock (options) {
  var files = options.files;
  var cors = options.cors;
  return (
    'location ~ ^/(?:' + files.map(escapeRegExp).join('|') + ')$ {\n' +
    '  expires 1y;\n' +
    '  add_header Cache-Control "public";\n' +
    (cors ? '  add_header Access-Control-Allow-Origin *;\n' : '') +
    '}\n'
  );
}

// Extensions of font files.
var fontPattern = /\.(?:ttf|ttc|otf|eot|woff|woff2)$/;

// Get a set of nginx location blocks to cache `files`.
function getNginxConf (files) {
  var fontFiles = [];
  var otherFiles = [];

  files.forEach(function (hashedFile) {
    // Separate fonts because they need a special directive (for CORS).
    if (fontPattern.test(hashedFile)) {
      fontFiles.push(hashedFile);
    } else {
      otherFiles.push(hashedFile);
    }
  });

  // Only join with newlines if there actually is a location block.
  return [].concat(
    (!isEmpty(otherFiles) ? getNginxLocationBlock({files: otherFiles}) : []),
    (!isEmpty(fontFiles) ? getNginxLocationBlock({files: fontFiles, cors: true}) : [])
  ).join('\n');
}

function writeNginxConf (path, conf) {
  if (!path) {
    throw new Error('Missing required manifest conf output path');
  }
  try {
    fs.writeFileSync(path, conf);
  } catch (error) {
    throw new Error('Failed to write manifest conf: ' + error);
  }
}

var manifestJsonPath = process.argv.slice(2)[0] || 'manifest.json';
var manifestConfPath = process.argv.slice(2)[1] || 'manifest.conf';
var hashedFiles = getHashedFiles(manifestJsonPath);
var nginxConf = getNginxConf(hashedFiles);
writeNginxConf(manifestConfPath, nginxConf);