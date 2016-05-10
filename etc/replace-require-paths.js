/* eslint-env node */

'use strict';

var acorn = require('acorn');
var escapeRegExp = require('lodash/escapeRegExp');
var escodegen = require('escodegen');
var find = require('lodash/find');
var forEach = require('lodash/forEach');
var forOwn = require('lodash/forOwn');
var path = require('path');
var includes = require('lodash/includes');
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

  var variableDeclaratorHandler = function (node) {
    if (node.id.type === 'Identifier' &&
        node.id.name === 'require' &&
        node.init && node.init.type === 'ObjectExpression') {
      // Matched `var require = {}`.
      configObjectExpression = node.init;
    }
  };

  walk.simple(ast, {
    CallExpression: callExpressionHandler,
    VariableDeclarator: variableDeclaratorHandler
  });

  if (!configObjectExpression) {
    throw new Error('No `require.config({})` object found');
  }

  var removeExtension = function (string, extension) {
    var extensionRegExp = new RegExp(escapeRegExp(extension) + '$');
    return string.replace(extensionRegExp, '');
  };

  var reviseProperty = function (property, part) {
    var partString = keyValueToString(property[part]);
    if (partString !== undefined) {
      var extension = path.extname(partString) || '.js';
      var mapPath = keyValueToString(property[part]) + extension;
      property[part] = {
        type: 'Literal',
        value: removeExtension(map[mapPath], extension)
      };
    }
  };

  var revisePropertyValues = function (objectExpression) {
    forEach(objectExpression.properties, function (property) {
      reviseProperty(property, 'value');
    });
  };

  var reviseMapConfig = function (mapObjectExpression) {
    forEach(mapObjectExpression.properties, function (property) {
      var keyString = keyValueToString(property.key);
      if (keyString !== '*') {
        reviseProperty(property, 'key');
      }
      if (property.value.type === 'ObjectExpression') {
        revisePropertyValues(property.value);
      }
    });
  };

  var pathsObjectExpression;
  var mapObjectExpression;

  forEach(configObjectExpression.properties, function (property) {
    var keyString = keyValueToString(property.key);
    if (keyString === 'paths' &&
        property.value.type === 'ObjectExpression') {
      pathsObjectExpression = property.value;
    } else if (keyString === 'map' &&
               property.value.type === 'ObjectExpression') {
      mapObjectExpression = property.value;
    }
  });

  if (!pathsObjectExpression) {
    pathsObjectExpression = {
      type: 'ObjectExpression',
      properties: []
    };
    configObjectExpression.properties.push({
      type: 'Property',
      key: {
        type: 'Literal',
        value: 'paths'
      },
      value: pathsObjectExpression
    });
  }

  revisePropertyValues(pathsObjectExpression);

  if (!mapObjectExpression) {
    mapObjectExpression = {
      type: 'ObjectExpression',
      properties: []
    };
    configObjectExpression.properties.push({
      type: 'Property',
      key: {
        type: 'Literal',
        value: 'map'
      },
      value: mapObjectExpression
    });
  }

  reviseMapConfig(mapObjectExpression);

  var wildcardMapProperty = find(mapObjectExpression.properties, {key: {value: '*'}});

  if (!wildcardMapProperty) {
    wildcardMapProperty = {
      type: 'Property',
      key: {
        type: 'Literal',
        value: '*'
      },
      value: {
        type: 'ObjectExpression',
        properties: []
      }
    };
    mapObjectExpression.value.properties.push(wildcardMapProperty);
  }

  if (wildcardMapProperty.value.type !== 'ObjectExpression') {
    throw new Error('"*" map must be an object');
  }

  var removeJsExtension = function (filePath) {
    var extension = path.extname(filePath);
    if (extension === '.js') {
      return removeExtension(filePath, extension);
    }
    return filePath;
  };

  // Add new revisioned paths.
  forOwn(map, function (newPath, oldPath) {
    wildcardMapProperty.value.properties.push({
      type: 'Property',
      key: {
        type: 'Literal',
        value: removeJsExtension(oldPath)
      },
      value: {
        type: 'Literal',
        value: removeJsExtension(newPath)
      }
    });
  });

  return escodegen.generate(ast);
};

module.exports = replaceRequirePaths;
