
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var fs = require('fs');
var url = require('url');
var app = express();

var json = fs.readFileSync(__dirname + '/../config.json', 'utf8');
fakeminder_config = JSON.parse(json);
var target_url = url.parse(fakeminder_config.target_site.url);

// all environments
app.set('port', target_url.port);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get(fakeminder_config.target_site.pathnames.protected, routes.protected);
app.get('/public/logon', routes.logon);
app.get(fakeminder_config.target_site.pathnames.logoff, routes.logoff);
app.get(fakeminder_config.target_site.pathnames.not_authenticated, routes.not_authenticated);
app.get(fakeminder_config.target_site.pathnames.bad_login, routes.bad_login);
app.get(fakeminder_config.target_site.pathnames.bad_password, routes.bad_password);
app.get(fakeminder_config.target_site.pathnames.account_locked, routes.account_locked);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
