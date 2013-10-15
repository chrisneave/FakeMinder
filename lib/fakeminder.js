var Cookies = require('cookies');
var fs = require('fs');

function FakeMinder() {
  var self = this;
  self.sessions = {};
  self.emptySession = { 'user':'' }
  self.SESSION_COOKIE = 'SMSESSION';

  var json = fs.readFileSync(__dirname + '/../config.json', 'utf8');
  self.config = JSON.parse(json);
}

FakeMinder.prototype.getUserForCurrentSession = function(req) {
  var cookieJar = new Cookies(req);
  var smsession = cookieJar.get(this.SESSION_COOKIE);

  if (!smsession) {
    return this.emptySession;
  }

  var currentSession = this.sessions[smsession];

  if (currentSession) {
    return currentSession;
  }

  return this.emptySession;
};

FakeMinder.prototype.handleRequest = function(req, res) {
  var cookieJar = new Cookies(req, res);
  var smsession = cookieJar.get(this.SESSION_COOKIE);
  var session_expired = false;
  var existing_session = this.sessions[smsession];
  if (existing_session) {
    var user = this.config.users[existing_session['name']];
    if (user) {
      var auth_headers = user['auth_headers'];
    }
  }
  var existing_session_expiration = new Date(1970, 1, 1);
  var now = new Date();
  var session_expires_if_before = new Date(now.getTime() - this.config.siteminder.session_expiry_minutes * 60000);

  res.setHeader('x-proxied-by', 'localhost:8000');

  // If we have an existing session load the expiration date.
  if (existing_session) {
    if (existing_session.session_expires) {
      existing_session_expiration = new Date(existing_session.session_expires);
    }
  }

  // Handle requests for the protected URI
  if (req.url.indexOf(this.getAbsoluteUrl('protected')) !== -1) {
    if (!existing_session) {
      session_expired = true;
    }

    if (existing_session_expiration < session_expires_if_before) {
      session_expired = true;
    }

    if (session_expired) {
      res.statusCode = 302;
      res.setHeader('Location', this.getAbsoluteUrl('not_authenticated'));
      res.end();
      return false;
    } else {
      if (auth_headers) {
        for(var auth_header in auth_headers) {
          res.setHeader(auth_header, auth_headers[auth_header]);
        }        
      }

      existing_session_expiration = new Date(now.getTime() + this.config.siteminder.session_expiry_minutes * 60000);
      this.sessions[smsession].session_expires = existing_session_expiration.toJSON();
    }
  }

  // Is the user logging off the application?
  if (req.url === this.getAbsoluteUrl('logoff')) {
    if (this.sessions[smsession]) {
      delete this.sessions[smsession];
    }
    smsession = 'LOGGEDOFF';
  }

  // If we are proxying the request make sure the SMSESSION cookie is set.
  cookieJar.set(this.SESSION_COOKIE, smsession, {'domain':'localhost'});
  return true;
};

FakeMinder.prototype.getAbsoluteUrl = function(urlType) {
  var url = this.config.target_site.urls[urlType];
  return this.config.target_site.root + url;
};

module.exports = FakeMinder;
