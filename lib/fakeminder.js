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

  // Is the user logging off the application?
  if (req.url === this.getAbsoluteUrl('logoff')) {
    if (this.sessions[smsession]) {
      delete this.sessions[smsession];
    }
    smsession = 'LOGGEDOFF';
  }

  cookieJar.set(this.SESSION_COOKIE, smsession, {'domain':'localhost'});

  res.setHeader('x-proxied-by', 'localhost:8000');

  if (req.url.indexOf(this.getAbsoluteUrl('protected')) !== -1) {
    res.statusCode = 302;
    res.setHeader('Location', this.getAbsoluteUrl('not_authenticated'));
    res.end();
    return false;
  }

  return true;
};

FakeMinder.prototype.getAbsoluteUrl = function(urlType) {
  var url = this.config.target_site.urls[urlType];
  return this.config.target_site.root + url;
};

module.exports = FakeMinder;
