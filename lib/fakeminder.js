var Cookies = require('cookies'),
    fs = require('fs'),
    qs = require('querystring'),
    Chain = require('../lib/chain.js'),
    _ = require('underscore');

function FakeMinder() {
  var self = this;
  self.sessions = {};
  self.emptySession = { 'user':'' };
  self.SESSION_COOKIE = 'SMSESSION';
  self.FORMCRED_COOKIE = 'FORMCRED';

  var json = fs.readFileSync(__dirname + '/../config.json', 'utf8');
  self.config = JSON.parse(json);
}

/** Parse inbound SMSESSION cookie and load session details */
FakeMinder.prototype.sessionInitializer = function(req, res, next) {
  var self = this,
      cookieJar = new Cookies(req, res),
      smsession = cookieJar.get(self.SESSION_COOKIE),
      existing_session = this.sessions[smsession],
      current_session = { 'smsession' : smsession, 'session_expires' : new Date(1970, 1, 1) },
      user;

  req.fm_session = {};

  if (!smsession || !existing_session) {
    next();
    return;
  };

  current_session.session_expires = new Date(existing_session.session_expires);
  user = this.config.users[existing_session.name];

  if (user) {
    current_session.auth_headers = user.auth_headers;
  }

  next();
};

/** Handle logon requests by processing form POST data and generating a FORMCRED cookie */
FakeMinder.prototype.logonHandler = function(req, res, next) {
  var self = this,
      chain = new Chain(),
      post_data = '';

  var handleLogon = function(post_data) {
    var self = this;
    for (var session in self.sessions) {
      if (self.sessions[session].name === post_data.USERNAME) {
        delete self.sessions[session];
      }
    }
  };

  // Is the user logging into the application?
  if (req.url === self.getAbsoluteUrl('logon') && req.method == "POST") {
    chain.then(function(err, next) {
      req.on('data', function(data) {
        post_data += data;
      });

      req.on('end', function() {
        handleLogon(require('querystring').parse(post_data));
        next();
      });
    });
  }

  chain.execute();
};

/** Handle requests for protected resources. If a login/password change is in process validate accordingly */
FakeMinder.prototype.protectedHandler = function(req, res, next) {
  var self = this,
      current_session = req.fm_session,
      auth_headers,
      cookieJar = new Cookies(req, res),
      formcred_cookie = cookieJar.get(self.FORMCRED_COOKIE),
      formcred_session,
      existing_session,
      new_session = {};

  // Handle requests for the protected URI
  if (req.url.indexOf(self.getAbsoluteUrl('protected')) === -1) {
    next();
    return;
  }

  // Check the FORMCRED cookie if one exists and act accordingly
  if (_.isUndefined(formcred_cookie) === false) {
    formcred_session = self.formcred[formcred_cookie];
    for(var session in self.sessions) {
      if (self.sessions[session].name === formcred_session.name) {
        delete(self.sessions[session]);
        break;
      }
    }

    new_session.name = formcred_session.name;
    new_session.session_expires = self.getSessionExpiration().toJSON();

    require('crypto').randomBytes(16, function(ex, buf) {
      var token = buf.toString('hex');
      self.sessions[token] = new_session;
      next();
    });
    return;
  } else {
    if (!current_session.smsession) {
      res.statusCode = 302;
      res.setHeader('Location', self.getAbsoluteUrl('not_authenticated'));
      res.end();
      return;
    }

    auth_headers = self.config.users[current_session.name].auth_headers;

    // If there are auth_headers then add them to the request.
    if (auth_headers) {
      for (var header in auth_headers) {
        req.setHeader(header, auth_headers[header]);
      }
    }

    // Only set an SMSESSION cookie for protected resources the user has access to.
    cookieJar.set(self.SESSION_COOKIE, current_session.smsession, {'domain':'localhost'});
    next();
  }
};

FakeMinder.prototype.logoffHandler = function(req, res, next) {
  var self = this,
      current_session = req.fm_session,
      cookieJar = new Cookies(req, res);

  if (req.url !== self.getAbsoluteUrl('logoff')) {
    next();
    return;
  }

  delete self.sessions[current_session.smsession];
  cookieJar.set(self.SESSION_COOKIE, 'LOGGEDOFF', {'domain':'localhost'});
  next();
};

/** Set an SMSESSION cookie if required */
FakeMinder.prototype.sessionFinalizer = function(req, res, next) {
  var self = this;
  res.setHeader('x-proxied-by', 'localhost:8000');
  req.headers['x-proxied-by'] = 'localhost:8000';
  self.resetSessionExpiry(req.fm_session);
  next();
};

FakeMinder.prototype.getAbsoluteUrl = function(url_type) {
  var url = this.config.target_site.urls[url_type];
  return this.config.target_site.root + url;
};

FakeMinder.prototype.resetSessionExpiry = function(current_session) {
  if (current_session) {
    current_session.session_expires = this.getSessionExpiration();
    this.sessions[current_session[this.SESSION_COOKIE]].session_expires = current_session.session_expires.toJSON();
  }
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
