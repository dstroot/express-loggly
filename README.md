[![Dependency status][dependency-badge]][dependency-url]
[![DevDependency status][dev-dep-badge]][dev-dep-url]
[![Licensing][license-badge]][license-url]
[![Release][release-badge]][release-url]
[![Issue tracking][issues-badge]][issues-url]

[dependency-badge]: http://img.shields.io/david/dstroot/express-loggly.svg?style=flat
[dependency-url]: https://david-dm.org/dstroot/express-loggly

[dev-dep-badge]: http://img.shields.io/david/dev/dstroot/express-loggly.svg?style=flat
[dev-dep-url]: https://david-dm.org/dstroot/express-loggly#info=devDependencies

[license-badge]: http://img.shields.io/badge/license-MIT-blue.svg?style=flat
[license-url]: #license

[release-badge]: http://img.shields.io/github/release/dstroot/express-loggly.svg?style=flat
[release-url]: https://github.com/dstroot/express-loggly/releases

[issues-badge]: http://img.shields.io/github/issues/dstroot/express-loggly.svg?style=flat
[issues-url]: https://github.com/dstroot/express-loggly/issues

express-loggly
===================

Express middleware to send JSON formatted logs to Loggly from an Express application.  It depends on [node-loggly](https://github.com/nodejitsu/node-loggly) by nodejitsu.

##Install

    npm install express-loggly --save

##Usage

Prepare like so

    var config = {
        token: 'your-really-long-input-token',
        subdomain: 'your-subdomain',
        tags: ['loggly-tag1', 'loggly-tag2', .., 'loggly-tagn'] 
    };

    var logger  = require('express-loggly')(config);
    

logger now has 2 methods for Express middleware:
- requestLogger
- errorLogger

And logger has an additional ad-hoc methods for logging
- debug, info, log, warn, error

###Middleware

    var app = express();
    //sequence of use() matters!
    app.use(logger.requestLogger()); // <-- log requests
    app.use(app.router);
    app.use(function(req, res, next){
        // Since this is the last non-error-handling middleware use()d, we assume 404, as nothing else responded.
        res.statusCode = 404;
        return next(new Error('Page not found'));
    });
    // error-handling middleware starts here! They take the same form as regular middleware,
    // however they require an arity of 4, aka the signature (err, req, res, next).
    // when connect has an error, it will invoke ONLY error-handling middleware.
    app.use(logger.errorLogger()); // <-- log errors
    app.use(function(err, req, res, next) {
        res.json(500, { status : "error", error: (typeof err === 'string' ? err : err.message) });
    });

###Ad-hoc logging

These methods log to Loggly as well 

    logger.debug('Some message'); // <-- logs with level=DEBUG
    logger.info('Some message');  // <-- logs with level=INFO
    logger.log('Some message');   // <-- logs with level=LOG
    logger.warn('Some message');  // <-- logs with level=WARN
    logger.error('Some message'); // <-- logs with level=ERROR

These methods actually take 2 parameters. The second one being an array of additional tags your want to capture in Loggly.

The first parameter may be a string, object or an instance of an error. The message is always transformed to an object with this signature: 

    {
        level     : 'DEBUG'        // Or INFO, LOG, WARN, ERROR
        pid       : 1234,          // whatever is returned by process.id 
        machine   : 'server_name', // whatever is returned by require('os').hostname  : 'req.hostname' // e.g. Localhost or your domain
        msg       : 'Some message' // Or the error.message
        ...Ór the name-value pair of the object instead of msg...
    }
    



    
    



