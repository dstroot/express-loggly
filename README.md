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

Express middleware to send JSON formatted logs to Loggly from an Express application.  Use this logger to send all web traffic to Loggly for capture and analysis.  It uses [node-loggly](https://github.com/nodejitsu/node-loggly) by nodejitsu.

Why JSON Logs?

https://journal.paul.querna.org/articles/2011/12/26/log-for-machines-in-json/
http://blog.nodejs.org/2012/03/28/service-logging-in-json-with-bunyan/

## Install

```
npm install express-loggly --save
```

## Usage

```js
var express = require('express')
var logger  = require('express-loggly')

var app = express()

// Setup Loggly configuration
var config = {
    token: 'your-really-long-input-token',
    subdomain: 'your-loggly-subdomain',
    tags: ['tag1', 'tag2', ... 'tagN'] 
};

// Sequence of use() matters!
// Put this *after* session and bodyParser

app.use(logger({ loggly: config }));
```

### Options

#### immediate

Write logs on request instead of response. This means that a requests will be logged even if the server crashes, but data from the response cannot be logged (like the response code).  Use like this:

```js
app.use(logger({
  immediate: true,
  loggly: config
}));
```

## License

The MIT License (MIT)

Copyright (c) 2014 Daniel Stroot dan@thestroots.com

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.




    
    



