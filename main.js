var http = require('http');
var httpProxy = require('http-proxy');
var FakeMinder = require('./lib/fakeminder.js');

var fm = new FakeMinder();

httpProxy.createServer(function(req, res, proxy) {

  if (fm.handleRequest(req, res)) {
    proxy.proxyRequest(req, res, {
      host: 'localhost',
      port: '4567'
    });
  }
}).listen(8000);
