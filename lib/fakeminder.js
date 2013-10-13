var Cookies = require('cookies');

var FakeMinder = exports.FakeMinder = function() {
  this.sessions = {};
  this.emptySession = { 'user':'' }
  this.SESSION_COOKIE = 'SMSESSION';
  this.config = {};
};

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
  var writeHead = res.writeHead;
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

  res.writeHead = function(statusCode, headers) {
    res.setHeader('x-proxied-by', 'localhost:8000');
    res.writeHead = writeHead;
  };
};

FakeMinder.prototype.isLogoffUrl = function(requestUrl) {
  return requestUrl === this.config.target_site.host + this.config.target_site.logoff_url;
};

FakeMinder.prototype.addSessionCookie = function(cookieValue, res) {

};
