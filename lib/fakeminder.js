var Cookies = require('cookies');
var fs = require('fs');
var qs = require('querystring');

function FakeMinder() {
  var self = this;
  self.sessions = {};
  self.emptySession = { 'user':'' }
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

  current_session['session_expires'] = new Date(existing_session.session_expires);
  user = this.config.users[existing_session['name']];

  if (user) {
    current_session['auth_headers'] = user['auth_headers'];
  }

  return current_session;
};

FakeMinder.prototype.handleProtectedRequest = function(res, current_session) {
    if (current_session['session_expires'] < this.getSessionExpiresBefore()) {
      res.statusCode = 302;
      res.setHeader('Location', this.getAbsoluteUrl('not_authenticated'));
      res.end();
      return false;
    }

    // If there are auth_headers then add them to the request.
    if (current_session.auth_headers) {
      for(var auth_header in current_session.auth_headers) {
        res.setHeader(auth_header, current_session.auth_headers[auth_header]);
      }
    }

    this.resetSessionExpiry(current_session);

    return true;
}

FakeMinder.prototype.handleLogoffRequest = function(current_session) {
  if (this.sessions[current_session.smsession]) {
    delete this.sessions[current_session.smsession];
  }
  current_session.smsession = 'LOGGEDOFF';
};

FakeMinder.prototype.handleLogonRequest = function(req, res) {

}

FakeMinder.prototype.handleRequest = function(req, res, done) {
  var self = this;
  var cookieJar = new Cookies(req, res);

  var current_session = this.getCurrentSession(cookieJar.get(this.SESSION_COOKIE));

  // Handle requests for the protected URI
  if (req.url.indexOf(this.getAbsoluteUrl('protected')) !== -1) {
    if (!this.handleProtectedRequest(res, current_session)) {
      return false;
    }
  }

  // Is the user logging off the application?
  if (req.url === this.getAbsoluteUrl('logoff')) {
    this.handleLogoffRequest(current_session);
  }

  // Only set an SMSESSION cookie if we have a value to set.
  if (current_session.smsession) {
    cookieJar.set(this.SESSION_COOKIE, current_session.smsession, {'domain':'localhost'});
  }

  res.setHeader('x-proxied-by', 'localhost:8000');
  
  if (done) {
    done(true);    
  }

  return true;
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
