var Cookies = require('cookies'),
    fs = require('fs'),
    qs = require('querystring'),
    Chain = require('../lib/chain.js'),
    _ = require('underscore'),
    url = require('url');

function FakeMinder() {
  var self = this;
  self.sessions = {};
  self.emptySession = {};
  self.formcred = {};
  self.SESSION_COOKIE = 'SMSESSION';
  self.FORMCRED_COOKIE = 'FORMCRED';

  var json = fs.readFileSync(__dirname + '/../config.json', 'utf8');
  self.config = JSON.parse(json);
}

FakeMinder.prototype.middleware = function(req, res, next) {
  var func_array = [];
  var self = this;
  var end_func = function() {};
  var next_func = function() {
    var func = func_array.shift();
    if (func) {
      func.call(self, req, res, next_func, end_func);
    }
  };

  func_array.push(self.sessionInitializer);
  func_array.push(self.protectedHandler);
  func_array.push(self.logonHandler);
  func_array.push(self.logoffHandler);
  func_array.push(self.sessionFinalizer);
  func_array.push(next);

  next_func();
};

/** Parse inbound SMSESSION cookie and load session details */
FakeMinder.prototype.sessionInitializer = function(req, res, next) {
  var cookieJar = new Cookies(req, res),
      smsession = cookieJar.get(this.SESSION_COOKIE),
      existing_session = this.sessions[smsession];

  if (!smsession || !existing_session) {
    next();
    return;
  };

  req.fm_session = existing_session;
  next();
};

/** Handle logon requests by processing form POST data and generating a FORMCRED cookie */
FakeMinder.prototype.logonHandler = function(req, res, next, end) {
  var self = this,
      cookieJar = new Cookies(req, res),
      post_data = '';

  if (req.url !== self.getUrl('logon') && req.method !== "POST") {
    next();
    return;
  }

  req.on('data', function(data) {
    post_data += data;
  });

  req.on('end', function() {
    post_data = qs.parse(post_data);
    /*
    for (var session in self.sessions) {
      if (self.sessions[session].name === post_data.USERNAME) {
        delete self.sessions[session];
      }
    }
    */

    var formcred = new Model.FormCred();
    self.formcred[formcred.formcred_id] = formcred;
    cookieJar.set(self.FORMCRED_COOKIE, formcred.formcred_id, {'domain':'localhost'});

    self.redirectToUrl(res, post_data.TARGET);
    end();
  });
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
      new_session,
      user;

  // Handle requests for the protected URI
  if (req.url.indexOf(self.getUrl('protected')) === -1) {
    next();
    return;
  }

  if (self.formcred) {
    formcred_session = self.formcred[formcred_cookie];
  }

  // Check the FORMCRED cookie if one exists and act accordingly
  if (_.isUndefined(formcred_session) === false) {
    switch (formcred_session.status) {
      // Login was successful
      case Model.FormCredStatus.good_login:
        for(var session in self.sessions) {
          if (self.sessions[session].name === formcred_session.name) {
            delete(self.sessions[session]);
            break;
          }
        }

        new_session = Model.Session();
        new_session.resetExpiration(this.config.siteminder.session_expiry_minutes);
        new_session.user = formcred_session.user;
        this.createNewSession(new_session);
        break;

      case Model.FormCredStatus.bad_login:
        this.redirectTo(res, 'bad_login');
        return;

      case Model.FormCredStatus.bad_password:
        user = _.findWhere(this.config.users, {'name':formcred_session.user.name});
        user.login_attempts += 1;

        if (user.login_attempts >= this.config.siteminder.max_login_attempts || user.locked) {
          user.locked = true;
          this.redirectTo(res, 'account_locked');
        } else {
          this.redirectTo(res, 'bad_password');
        }

        return;
    }
  } else {
    if (_.isUndefined(current_session) === true) {
      this.redirectTo(res, 'not_authenticated');
      return;
    }

    if (current_session.hasExpired()) {
      this.redirectTo(res, 'not_authenticated');
      return;
    }

    auth_headers = current_session.user.auth_headers;

    // If there are auth_headers then add them to the request.
    if (auth_headers) {
      for (var header in auth_headers) {
        req.setHeader(header, auth_headers[header]);
      }
    }
  }

  next();
};

FakeMinder.prototype.logoffHandler = function(req, res, next) {
  var self = this,
      current_session = req.fm_session,
      cookieJar = new Cookies(req, res);

  if (req.url === self.getUrl('logoff')) {
    // Only set an SMSESSION cookie for protected resources the user has access to.
    self.removeSession(current_session.session_id);
    cookieJar.set(self.SESSION_COOKIE, 'LOGGEDOFF', {'domain':'localhost'});
  }

  next();
};

/** Set an SMSESSION cookie if required */
FakeMinder.prototype.sessionFinalizer = function(req, res, next) {
  var self = this;
  res.setHeader('x-proxied-by', 'localhost:8000');
  req.headers['x-proxied-by'] = 'localhost:8000';
  if (req.fm_session) {
    req.fm_session.resetExpiration(this.config.siteminder.session_expiry_minutes);    
  }
  next();
};

FakeMinder.prototype.getUrl = function(url_type) {
  return this.config.target_site.urls[url_type];
};

FakeMinder.prototype.createNewSession = function(new_session) {
  this.sessions[new_session.session_id] = new_session;
};

FakeMinder.prototype.removeSession = function(session_id) {
  delete(this.sessions[session_id]);
};

FakeMinder.prototype.redirectTo = function(res, url_type) {
  var url = this.getUrl(url_type);
  this.redirectToUrl(res, url);
};

FakeMinder.prototype.redirectToUrl = function(res, url) {
  res.statusCode = 302;
  res.setHeader('Location', url);
  res.end();
}

module.exports = FakeMinder;
