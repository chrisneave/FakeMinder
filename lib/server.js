/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2013 Chris Neave
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

var http = require('http'),
    url = require('url'),
    httpProxy = require('http-proxy'),
    FakeMinder = require(__dirname + '/../lib/fakeminder.js');

module.exports.start = function(config_file) {
  if (!require('fs').existsSync(config_file)) {
    console.error('Config file %s does not exist\n', config_file);
    process.exit();
  }

  var fm = new FakeMinder(config_file);
  var port = url.parse(fm.config.proxy().port);
  var upstreamApp = fm.config.upstreamApp('sample_target');

  var server = httpProxy.createServer(function(req, res, proxy) {
    fm.middleware(req, res, function() {
      console.log('Proxying request -> ' + req.method + ' ' + req.url);

      proxy.proxyRequest(req, res, {
        host: upstreamApp.hostname,
        port: upstreamApp.port
      });
    });
  }).listen(port);

  console.log('FakeMinder listening on port ' + port);

  server.proxy.on('proxyError', function(err, req, res) {
    if (err.code === 'ECONNREFUSED') {
      console.log('Error -> Connection refused! Make sure the target application ' + upstreamApp.hostname + ' is running');
    }
  });

  server.proxy.on('proxyResponse', function(req, res, response) {

  });
};
