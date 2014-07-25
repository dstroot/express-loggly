'use strict';

// Example:
//  - http://www.hacksparrow.com/how-to-write-midddleware-for-connect-express-js.html
// Other middleware for logging:
//  - https://gist.github.com/flockonus/5380753
//  - https://github.com/villadora/express-bunyan-logger/blob/master/index.js

/**
 * Module Dependencies
 */

var _         = require('underscore');
var os        = require('os');
var debug     = require('debug')('express2loggly');
var loggly    = require('loggly');
var useragent = require('useragent');

exports = module.exports = function (config) {

  // Create Loggly client using passed in configuration
  var client = loggly.createClient(config);

  // Get machine name
  var machine = os.hostname();

  // This will async load the database from the
  // server and compile it to a proper JavaScript
  // supported format. Always up-to-date parsing!
  useragent(true);

  // Define tags for Loggly
  var expressTags = ['node', 'express', 'http'];
  var adhocTags   = ['node', 'express'];

  // Combine with configured tags
  if (config.tags instanceof Array) {
    expressTags = _.uniq(expressTags.concat(config.tags));
    adhocTags   = _.uniq(adhocTags.concat(config.tags));
  }

  var expressLogger = function (err, req, res, next, type) {
    if (!err && type === 'error') {
      debug('We should have an err if the type is "error".');
      return;
    }

    // Set Levels
    var level;
    if (err || res.statusCode >= 500) { // server internal error or error
      level = 'ERROR';
    } else if (res.statusCode >= 400) { // client error
      level = 'WARN';
    } else {
      level = 'INFO';
    }

    // Define Fields
    var fields = {
      'level'          : level,
      'msg'            : (err ? (typeof err === 'string' ? err : err.message) : type),
      'pid'            : process.pid.toString(),
      'machine'        : machine,
      'date'           : new Date().toUTCString(),
      'hostname'       : req.hostname,
      'path'           : req.path,
      'query'          : Object.keys(req.query).length > 0 ? req.query : '',
      'protocol'       : req.protocol,
      'method'         : req.method,
      'url'            : req.originalUrl || req.url || '',
      'status'         : res.statusCode.toString(),
      'remote-address' : req.headers['x-forwarded-for'] || req.connection.remoteAddress ||
                         (req.socket && req.socket.remoteAddress) ||
                         (req.socket.socket && req.socket.socket.remoteAddresss),
      'user-agent'     : useragent.lookup(req.headers['user-agent']),
      'http'           : req.httpVersionMajor + '.' + req.httpVersionMinor,
      'session'        : req.sessionID,
      'body'           : req.body,
      'referrer'       : req.header('referer') || req.header('referrer') || '-',
    };

    // Log to Loggly
    client.log(fields, expressTags, function (err, result) {
      if (err) {
        console.log(err.message);
      } else {
        debug('Loggly: '+ JSON.stringify(result));
      }
    });

    // Make sure you call next(), or else you will end up
    // with a hung application. Also pass `err` along.
    next(err);

  };

  // Used by ad-hoc loggers
  var buildFields = function (level, msg) {
    var fields = {
      'level': level.toUpperCase()
    };

    if (msg instanceof Error) {
      fields.msg = msg.message;
    } else if (typeof msg === 'string') {
      fields.msg = msg;
    } else if (msg && Object.prototype.toString.call(msg) === '[object Object]') {
      _.extend(fields, msg);
    }

    fields.pid = process.pid;
    fields.machine = machine;

    return fields;
  };

  // Express middleware
  return {
    // Main loggers - request and error
    requestLogger: function () {
      return function (req, res, next) {
        debug('requestLogger');
        expressLogger(null, req, res, next, 'request');
      };
    },
    errorLogger: function () {
      return function (err, req, res, next) {
        debug('errorLogger');
        expressLogger(err, req, res, next, 'error');
      };
    },
    // Ad-hoc loggers
    debug: function (msg, extraTags) {
      var tags = (extraTags instanceof Array) ? _.uniq(extraTags.concat(adhocTags)) : adhocTags;
      client.log(buildFields('DEBUG', msg), tags);
    },
    info: function (msg, extraTags) {
      var tags = (extraTags instanceof Array) ? _.uniq(extraTags.concat(adhocTags)) : adhocTags;
      client.log(buildFields('INFO', msg), tags);
    },
    log: function (msg, extraTags) {
      var tags = (extraTags instanceof Array) ? _.uniq(extraTags.concat(adhocTags)) : adhocTags;
      client.log(buildFields('LOG', msg), tags);
    },
    warn: function (msg, extraTags) {
      var tags = (extraTags instanceof Array) ? _.uniq(extraTags.concat(adhocTags)) : adhocTags;
      client.log(buildFields('WARN', msg), tags);
    },
    error: function (msg, extraTags) {
      var tags = (extraTags instanceof Array) ? _.uniq(extraTags.concat(adhocTags)) : adhocTags;
      client.log(buildFields('ERROR', msg), tags);
    }
  };

};
