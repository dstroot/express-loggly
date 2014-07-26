'use strict';

/**
 * Module dependencies.
 */

var _           = require('underscore');
var os          = require('os');
var debug       = require('debug')('express-loggly');
var loggly      = require('loggly');
var useragent   = require('useragent');
var onFinished  = require('finished');

/**
 * Create middleware.
 *
 * @param {Object} [options]
 * @return {Function} middleware
 * @api public
 */

exports = module.exports = function (options) {

  // Needed for useragent - this will async load the
  // database from the server and compile it to a
  // proper JavaScript supported format.
  // Always up-to-date agent parsing!
  useragent(true);

  // Get & read options
  options = options || {};
  var immediate = options.immediate;
  var stream = options.stream || process.stdout;
  var buffer = options.buffer;
  var config = options.loggly || {};

  if (_.isEmpty(config)) {
    debug('Error: Loggly configuration was not passed in!');
    // do nothing
    return function logger (req, res, next) {
      next();
    };
  }

  // Create Loggly client using passed in configuration
  var client = loggly.createClient(config);

  // Define tags for Loggly
  var expressTags = ['node', 'express', 'http'];
  var adhocTags   = ['node', 'express'];

  // Combine with configured tags
  if (config.tags instanceof Array) {
    debug('Config Tags: ' + config.tags.toString());
    expressTags = _.uniq(expressTags.concat(config.tags));
    adhocTags   = _.uniq(adhocTags.concat(config.tags));
  }

  // Get machine name & PID
  var machine = os.hostname();
  var pid = process.pid.toString();

  // Buffering support
  if (buffer) {
    var realStream = stream;
    var buf = [];
    var timer = null;
    var interval = 1000; // how long before we flush?

    // Flush function
    var flush = function () {
      timer = null;
      if (buf.length) {
        realStream.write(buf.join(''));
        buf.length = 0;
      }
    };

    // Swap the stream
    stream = {
      write: function (str) {
        if (timer === null) {
          timer = setTimeout(flush, interval);
        }
        buf.push(str);
      }
    };
  }

  // Logging format
  var logFormat = function (req, res) {

    // get response time and content length
    var time = getResponseTime (req, res);
    var content = getLength(req, res, 'content-length');

    // Set Levels
    var level;
    if (res.statusCode >= 500) {
      level = 'ERROR';
    } else if (res.statusCode >= 400) {
      level = 'WARN';
    } else {
      level = 'INFO';
    }

    // Define JSON object
    var fields = {
      'date'            : new Date().toUTCString(),  // Note UTC
      'level'           : level,
      'server'          : {
        'server-name'   : machine,
        'pid'           : pid
      },
      'request'         : {
        'method'        : req.method,
        'protocol'      : req.protocol,
        'version'       : req.httpVersionMajor + '.' + req.httpVersionMinor,
        'hostname'      : req.hostname,
        'path'          : req.path,
        'query'         : Object.keys(req.query).length > 0 ? req.query : '',
        'session'       : req.sessionID,
        'body'          : req.body,
        'remote-address': req.headers['x-forwarded-for'] || req.connection.remoteAddress ||
                          (req.socket && req.socket.remoteAddress) ||
                          (req.socket.socket && req.socket.socket.remoteAddresss)
      },
      'response'        : {
        'status'        : res._headers ? res.statusCode.toString() : '',
        'content-length': content ? content + ' bytes' : '',
        'response-time' : time + ' ms'
      },
      // 'url'            : req.originalUrl || req.url,
      'user-agent'      : useragent.lookup(req.headers['user-agent']),
      'referrer'        : req.headers['referer'] || req.headers['referrer']
      // 'req-headers'    : req.headers,
      // 'res-headers'    : res._headers
    };

    return fields;
  };

  return function logger (req, res, next) {
    req._startAt = process.hrtime();
    req._startTime = new Date();
    req._remoteAddress = req.connection && req.connection.remoteAddress;

    function logRequest () {
      var record = logFormat(req, res);

      // Log to Loggly
      client.log(record, expressTags, function (err, result) {
        if (err) {
          debug(err.message);
        } else {
          debug('Log Record: ' + JSON.stringify(record));
          debug('Response: ' + JSON.stringify(result));
        }
      });
    }

    // Immediate or not
    if (immediate) {
      logRequest();
    } else {
      onFinished(res, logRequest);
    }

    // Make sure you call next(), or else you will end up
    // with a hung application.
    next();
  };

};

function getResponseTime (req, res) {
  if (!res._header || !req._startAt) {
    return '';
  }
  var diff = process.hrtime(req._startAt);
  var ms = diff[0] * 1e3 + diff[1] * 1e-6;
  return ms.toFixed(3);
}

function getLength (req, res, field) {
  return (res._headers || {})[field.toLowerCase()];
}
