var http = require('http');
var httpProxy = require('http-proxy');
var FakeMinder = require('./lib/fakeminder.js');

var fm = new FakeMinder();
var target_host = fm.config.target_site.host;
var target_port = fm.config.target_site.port;
var target_hostname = target_host + ':' + target_port;

var server = httpProxy.createServer(function(req, res, proxy) {

  fm.handleRequest(req, res, function() {
    console.log('Proxying request -> ' + req.method + ' ' + req.url);

    proxy.proxyRequest(req, res, {
      host: target_host,
      port: target_port
    });
  });
}).listen(8000);

server.proxy.on('proxyError', function(err, req, res) {
  if (err.code === 'ECONNREFUSED') {
    console.log('Error -> Connection refused! Make sure the target application ' + target_hostname + ' is running');
  }
});
