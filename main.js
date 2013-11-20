var http = require('http'),
    url = require('url'),
    httpProxy = require('http-proxy'),
    FakeMinder = require('./lib/fakeminder.js'),
    fm = new FakeMinder(),
    proxy_url = url.parse(fm.config.proxy.url),
    target_url = url.parse(fm.config.target_site.url),
    server;

server = httpProxy.createServer(function(req, res, proxy) {
  fm.middleware(req, res, function() {
    console.log('Proxying request -> ' + req.method + ' ' + req.url);

    proxy.proxyRequest(req, res, {
      host: target_url.hostname,
      port: target_url.port
    });
  });
}).listen(proxy_url.port);

console.log('FakeMinder listening on port ' + proxy_url.port);

server.proxy.on('proxyError', function(err, req, res) {
  if (err.code === 'ECONNREFUSED') {
    console.log('Error -> Connection refused! Make sure the target application ' + target_url.host + ' is running');
  }
});

server.proxy.on('proxyResponse', function(req, res, response) {

});
