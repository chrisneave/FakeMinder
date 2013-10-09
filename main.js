var http = require('http');
var httpProxy = require('http-proxy');
var fm = require('../lib/fakeminder.js');

var fakeMinder = new fm.FakeKinder();

httpProxy.createServer(function(req, res, proxy) {

  fakeMinder.handleRequest(req, res);

  proxy.proxyRequest(req, res, {
    host: 'localhost',
    port: '4567'
  });
}).listen(8000);
