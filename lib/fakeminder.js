var Cookies = require('cookies');
var fs = require('fs');
var qs = require('querystring');
var Chain = require('../lib/chain.js');

function FakeMinder() {
  var self = this;
  self.sessions = {};
  self.emptySession = { 'user':'' };
  self.SESSION_COOKIE = 'SMSESSION';

  var json = fs.readFileSync(__dirname + '/../config.json', 'utf8');
  self.config = JSON.parse(json);
}

FakeMinder.prototype.getCurrentSession = function(smsession) {
  var existing_session = this.sessions[smsession];
  var current_session = { 'smsession' : smsession, 'session_expires' : new Date(1970, 1, 1) };
  var user;

  if (!existing_session) {
    return current_session;
  }

  current_session.session_expires = new Date(existing_session.session_expires);
  user = this.config.users[existing_session.name];

  if (user) {
    current_session.auth_headers = user.auth_headers;
  }

  return current_session;
};

FakeMinder.prototype.handleProtectedRequest = function(res, current_session) {
    if (current_session.session_expires < this.getSessionExpiresBefore()) {
      res.statusCode = 302;
      res.setHeader('Location', this.getAbsoluteUrl('not_authenticated'));
      res.end();
      return false;
    }

    // If there are auth_headers then add them to the request.
    if (current_session.auth_headers) {
      for (var auth_header in current_session.auth_headers) {
        res.setHeader(auth_header, current_session.auth_headers[auth_header]);
      }
    }

    this.resetSessionExpiry(current_session);

    return true;
};

FakeMinder.prototype.handleLogonRequest = function(post_data, done) {
  var self = this;
  for (var session in self.sessions) {
    if (self.sessions[session].name === post_data.USERNAME) {
      delete self.sessions[session];
    }
  }

  var new_session = {};
  new_session.name = post_data.USERNAME;
  new_session.session_expires = self.getSessionExpiration().toJSON();

  require('crypto').randomBytes(16, function(ex, buf) {
    var token = buf.toString('hex');
    self.sessions[token] = new_session;
    done();
  });
};

FakeMinder.prototype.handleRequest = function(req, res, done) {
  var self = this;
  var cookieJar = new Cookies(req, res);

  var current_session = self.getCurrentSession(cookieJar.get(self.SESSION_COOKIE));

  // Handle requests for the protected URI
  if (req.url.indexOf(self.getAbsoluteUrl('protected')) !== -1) {
    if (!self.handleProtectedRequest(res, current_session)) {
      done(false);        
      return;
    }
  }

  var chain = new Chain();
  var post_data = '';

  // Is the user logging into the application?
  if (req.url === self.getAbsoluteUrl('logon')) {
    if (req.method == "POST") {

      chain.then(function(err, next) {
        req.on('data', function(data) {
          post_data += data;
        });

        req.on('end', function() {
          var parsed_data = require('querystring').parse(post_data);
          self.handleLogonRequest(parsed_data, function() {
            next();
          });
        });
      });
    }
  }

  // Is the user logging off the application?
  if (req.url === self.getAbsoluteUrl('logoff')) {
    if (self.sessions[current_session.smsession]) {
      delete self.sessions[current_session.smsession];
    }
    current_session.smsession = 'LOGGEDOFF';
  }

  chain.then(function(err, next, data) {
    // Only set an SMSESSION cookie if we have a value to set.
    if (current_session.smsession) {
      cookieJar.set(self.SESSION_COOKIE, current_session.smsession, {'domain':'localhost'});
    }

    res.setHeader('x-proxied-by', 'localhost:8000');
    next();
  });

  chain.then(done);
  chain.execute();
};

FakeMinder.prototype.getAbsoluteUrl = function(url_type) {
  var url = this.config.target_site.urls[url_type];
  return this.config.target_site.root + url;
};

FakeMinder.prototype.resetSessionExpiry = function(current_session) {
  current_session.session_expires = this.getSessionExpiration();
  this.sessions[current_session.smsession].session_expires = current_session.session_expires.toJSON();
};

FakeMinder.prototype.getSessionExpiration = function() {
  var now = new Date();
  return new Date(now.getTime() + this.config.siteminder.session_expiry_minutes * 60000);
};

FakeMinder.prototype.getSessionExpiresBefore = function() {
  var now = new Date();
  return new Date(now.getTime() - this.config.siteminder.session_expiry_minutes * 60000);
};

module.exports = FakeMinder;
