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

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var fs = require('fs');
var url = require('url');
var app = express();

var json = fs.readFileSync(__dirname + '/../config.json', 'utf8');
var fakeminder_config = JSON.parse(json);
routes.init(fakeminder_config);
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
if ('development' === app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
var protected_urls = fakeminder_config.target_site.pathnames.protected;
for (var i = 0; i < protected_urls.length; i++) {
  if (protected_urls[i].protected) {
    app.get(protected_urls[i].url, routes.protected);
  }
}
app.get('/public/logon', routes.logon);
app.get(fakeminder_config.target_site.pathnames.logoff, routes.logoff);
app.get(fakeminder_config.target_site.pathnames.not_authenticated, routes.not_authenticated);
app.get(fakeminder_config.target_site.pathnames.bad_login, routes.bad_login);
app.get(fakeminder_config.target_site.pathnames.bad_password, routes.bad_password);
app.get(fakeminder_config.target_site.pathnames.account_locked, routes.account_locked);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
