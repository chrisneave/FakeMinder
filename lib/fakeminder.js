var FakeMinder = exports.FakeMinder = function() {
  this.sessions = {};
  this.emptySession = { 'user':'' }
  this.SESSION_COOKIE = 'SMSESSION';
  this.config = {};
};

FakeMinder.prototype.getUserForCurrentSession = function(req) {
  var cookie = req.headers['cookie'];

  if (!cookie) {
    return this.emptySession;
  }

  var cookieSplit = cookie.split('=');
  var currentSessionCookie = cookieSplit[1];
  var currentSession = this.sessions[currentSessionCookie];

  if (currentSession) {
    return currentSession;
  }

  return this.emptySession;
};

FakeMinder.prototype.handleRequest = function(req, res) {
  var writeHead = res.writeHead;
  var smsession = this.sessions[this.SESSION_COOKIE];
  var sessionCookie = this.SESSION_COOKIE;

  if (smsession === undefined) {
    smsession = 'LoggedOn';
  }

  this.sessions[this.SESSION_COOKIE] = smsession;

  // Is the user logging off the application?
  if (this.isLogoffUrl(req.url)) {
    smsession = 'LOGGEDOFF';
  }

  res.writeHead = function(statusCode, headers) {
    res.setHeader('x-proxied-by', 'localhost:8000');
    var cookieValue = sessionCookie + '=' + smsession + '; path=/; domain=localhost; httponly';
    res.setHeader('Set-Cookie', cookieValue);
    res.writeHead = writeHead;
  };
};

FakeMinder.prototype.isLogoffUrl = function(requestUrl) {
  return requestUrl === this.config.target_site.host + this.config.target_site.logoff_url;
};

FakeMinder.prototype.addSessionCookie = function(cookieValue, res) {

};
