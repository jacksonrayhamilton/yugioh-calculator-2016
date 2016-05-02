/* eslint-env node */

'use strict';

var acorn = require('acorn');
var escapeRegExp = require('lodash/escapeRegExp');
var escodegen = require('escodegen');
var forEach = require('lodash/forEach');
var includes = require('lodash/includes');
var some = require('lodash/some');
var walk = require('acorn/dist/walk');

/**
 * Convert a property key or value to a string.
 */
var keyValueToString = function (node) {
  if (node.type === 'Identifier') {
    return node.name;
  } else if (node.type === 'Literal' &&
             typeof node.value === 'string') {
    return node.value;
  }
  return undefined;
};

/**
 * Given JavaScript `source` and module id `map`, update
 * `require.config({paths: {}})` with new module ids.
 */
var replaceRequirePaths = function (source, map) {
  var ast = acorn.parse(source);
  var configObjectExpression;
  var callExpressionHandler = function (node) {
    if (node.callee.type === 'MemberExpression' &&
        node.callee.object.type === 'Identifier' &&
        includes(['require', 'requirejs'], node.callee.object.name) &&
        node.callee.property.name === 'config' &&
        node.arguments[0] && node.arguments[0].type === 'ObjectExpression') {
      // Matched `require.config({})` or `requirejs.config({})`.
      configObjectExpression = node.arguments[0];
    }
  };
  walk.simple(ast, {
    CallExpression: callExpressionHandler
  });
  if (!configObjectExpression) {
    throw new Error('No `require.config({})` object found');
  }
  var pathsObjectExpression;
  some(configObjectExpression.properties, function (property) {
    var keyString = keyValueToString(property.key);
    if (keyString === 'paths' &&
        property.value.type === 'ObjectExpression') {
      pathsObjectExpression = property.value;
      return true;
    }
    return false;
  });
  if (pathsObjectExpression) {
    var useRevision = function (property, extension) {
      var path = keyValueToString(property.value) + extension;
      var extensionRegExp = new RegExp(escapeRegExp(extension) + '$');
      property.value = {
        type: 'Literal',
        value: map[path].replace(extensionRegExp, '')
      };
    };
    forEach(pathsObjectExpression.properties, function (property) {
      var keyString = keyValueToString(property.key);
      var valueString = keyValueToString(property.value);
      if (keyString !== undefined && valueString !== undefined) {
        if (/Styles$/.test(keyString)) {
          useRevision(property, '.css');
        } else {
          useRevision(property, '.js');
        }
      }
    });
  }
  return escodegen.generate(ast);
};

module.exports = replaceRequirePaths;
