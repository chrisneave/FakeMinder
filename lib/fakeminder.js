var Cookies = require('cookies');

function FakeMinder() {
  var self = this;
  self.sessions = {};
  self.emptySession = { 'user':'' }
  self.SESSION_COOKIE = 'SMSESSION';

  self.config = {};
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

  // Is the user logging off the application?
  if (this.isLogoffUrl(req.url)) {
    if (this.sessions[smsession]) {
      delete this.sessions[smsession];
    }
    smsession = 'LOGGEDOFF';
  }

  cookieJar.set(this.SESSION_COOKIE, smsession, {'domain':'localhost'});

  res.setHeader('x-proxied-by', 'localhost:8000');

  return true;
};

FakeMinder.prototype.isLogoffUrl = function(requestUrl) {
  return requestUrl === this.config.target_site.host + this.config.target_site.logoff_url;
};

FakeMinder.prototype.addSessionCookie = function(cookieValue, res) {

};

module.exports = FakeMinder;
