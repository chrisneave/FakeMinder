var Cookies = require('cookies'),
    fs = require('fs'),
    qs = require('querystring'),
    Chain = require('../lib/chain.js'),
    _ = require('underscore'),
    url = require('url'),
    Model = require('../lib/model.js');

function FakeMinder() {
  var self = this,
      json = fs.readFileSync(__dirname + '/../config.json', 'utf8');
  self.config = JSON.parse(json);
  self.sessions = {};
  self.emptySession = {};
  self.formcred = {};
  self.SESSION_COOKIE = self.config.siteminder.sm_cookie;
  self.FORMCRED_COOKIE = self.config.siteminder.formcred_cookie;

  self._getUrl = function(url_type) {
    return self.config.target_site.urls[url_type];
  };

  self._createNewSession = function(new_session) {
    self.sessions[new_session.session_id] = new_session;
  };

  self._removeSession = function(session_id) {
    delete(self.sessions[session_id]);
  };

  self._redirectTo = function(res, url_type) {
    var url = self._getUrl(url_type);
    self._redirectToUrl(res, url);
  };

  self._redirectToUrl = function(res, url) {
    res.statusCode = 302;
    res.setHeader('Location', url);
    res.end();
  }
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

  func_array.push(self.init);
  func_array.push(self.protected);
  func_array.push(self.logon);
  func_array.push(self.logoff);
  func_array.push(self.end);
  func_array.push(next);

  next_func();
};

/** Parse inbound SMSESSION cookie and load session details */
FakeMinder.prototype.init = function(req, res, next) {
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
FakeMinder.prototype.logon = function(req, res, next, end) {
  var self = this,
      cookieJar = new Cookies(req, res),
      post_data = '',
      formcred,
      user;

  if (req.url !== self._getUrl('logon') && req.method !== "POST") {
    next();
    return;
  }

  req.on('data', function(data) {
    post_data += data;
  });

  req.on('end', function() {
    post_data = qs.parse(post_data);

    formcred = new Model.FormCred();
    self.formcred[formcred.formcred_id] = formcred;
    cookieJar.set(self.FORMCRED_COOKIE, formcred.formcred_id, {'domain':'localhost'});

    // Search for the user, validate the password and set a status accordingly
    user = _.findWhere(self.config.users, {'name': post_data.USERNAME});
    formcred.user = user;
    if (user) {
      if (user.password === post_data.PASSWORD) {
        formcred.status = Model.FormCredStatus.good_login;
      } else {
        formcred.status = Model.FormCredStatus.bad_password;
      }
    } else {
      formcred.status = Model.FormCredStatus.bad_login;
    }

    self._redirectToUrl(res, post_data.TARGET);
    end();
  });
};

/** Handle requests for protected resources. If a login/password change is in process validate accordingly */
FakeMinder.prototype.protected = function(req, res, next) {
  var self = this,
      current_session = req.fm_session,
      auth_headers,
      cookieJar = new Cookies(req, res),
      formcred_cookie = cookieJar.get(self.FORMCRED_COOKIE),
      formcred_session,
      existing_session,
      new_session,
      user;

  // Exit from this function early if the URL is not 'protected'
  if (req.url.indexOf(self._getUrl('protected')) === -1) {
    next();
    return;
  }

  if (self.formcred) {
    formcred_session = self.formcred[formcred_cookie];
  }

  // Check the FORMCRED cookie if one exists and act accordingly
  if (_.isUndefined(formcred_session) === false) {
    // Remove for formcred session from self before doing any validation. FORMCRED is only a transient value that is not required after this step.
    delete(self.formcred[formcred_cookie]);

    switch (formcred_session.status) {
      // Login was successful
      case Model.FormCredStatus.good_login:
        for(var session in self.sessions) {
          if (self.sessions[session].name === formcred_session.name) {
            delete(self.sessions[session]);
            break;
          }
        }

        new_session = new Model.Session();
        new_session.resetExpiration(this.config.siteminder.session_expiry_minutes);
        new_session.user = formcred_session.user;
        this._createNewSession(new_session);
        req.fm_session = new_session;
        break;

      case Model.FormCredStatus.bad_login:
        this._redirectTo(res, 'bad_login');
        return;

      case Model.FormCredStatus.bad_password:
        user = _.findWhere(this.config.users, {'name':formcred_session.user.name});
        user.login_attempts += 1;

        if (user.login_attempts >= this.config.siteminder.max_login_attempts || user.locked) {
          user.locked = true;
          this._redirectTo(res, 'account_locked');
        } else {
          this._redirectTo(res, 'bad_password');
        }

        return;
    }
  } else {
    if (_.isUndefined(current_session) === true) {
      this._redirectTo(res, 'not_authenticated');
      return;
    }

    if (current_session.hasExpired()) {
      this._redirectTo(res, 'not_authenticated');
      return;
    }

    auth_headers = current_session.user.auth_headers;

    // If there are auth_headers then add them to the request.
    if (auth_headers) {
      for (var header in auth_headers) {
        req.headers[header] = auth_headers[header];
      }
    }
  }

  next();
};

FakeMinder.prototype.logoff = function(req, res, next) {
  var self = this,
      current_session = req.fm_session,
      cookieJar = new Cookies(req, res);

  if (req.url === self._getUrl('logoff')) {
    // Only set an SMSESSION cookie for protected resources the user has access to.
    if (current_session) {
      self._removeSession(current_session.session_id);
    }
    cookieJar.set(self.SESSION_COOKIE, 'LOGGEDOFF', {'domain':'localhost'});
  }

  next();
};

/** Set an SMSESSION cookie if required */
FakeMinder.prototype.end = function(req, res, next) {
  var cookieJar = new Cookies(req, res);

  res.setHeader('x-proxied-by', 'localhost:8000');
  req.headers['x-proxied-by'] = 'localhost:8000';
  if (req.fm_session) {
    req.fm_session.resetExpiration(this.config.siteminder.session_expiry_minutes);
    cookieJar.set(this.SESSION_COOKIE, req.fm_session.session_id, {'domain':'localhost'});
  }
  next();
};

module.exports = FakeMinder;
