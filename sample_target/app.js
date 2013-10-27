
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var fs = require('fs');

var app = express();

var json = fs.readFileSync(__dirname + '/../config.json', 'utf8');
fakeminder_config = JSON.parse(json);

// all environments
app.set('port', fakeminder_config.target_site.port);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get(fakeminder_config.target_site.urls.protected, routes.protected);
app.get('/public/logon', routes.logon);
app.get(fakeminder_config.target_site.urls.logoff, routes.logoff);
app.get(fakeminder_config.target_site.urls.not_authenticated, routes.not_authenticated);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
