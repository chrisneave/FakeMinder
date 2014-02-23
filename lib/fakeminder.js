/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2013 Chris Neave
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

var Cookies = require('cookies'),
    qs = require('querystring'),
    Chain = require('../lib/chain.js'),
    _ = require('underscore'),
    url = require('url'),
    Model = require('../lib/model.js'),
    pathfilter = require('../lib/pathfilter'),
    Config = require('../lib/config'),
    util = require('util'),
    log;

function FakeMinder(filename, logger) {
  var self = this;
  log = logger;

  self.config = new Config();
  self.config.load(filename);

  self.sessions = {};
  self.emptySession = {};
  self.formcred = {};
  self.SESSION_COOKIE = self.config.siteminder().sm_cookie;
  self.FORMCRED_COOKIE = self.config.siteminder().formcred_cookie;

  self._getUrl = function(url_type) {
    return self.config.upstreamApp('sample_target')[url_type];
  };

  self._createNewSession = function(new_session) {
    self.sessions[new_session.session_id] = new_session;
  };

  self._removeSession = function(session_id) {
    log.verbose('fakeminder', 'SessionID %s has ended',  session_id);
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
  };

  self._setCookie = function(req, res, cookie_name, cookie_value) {
    var cookieJar = new Cookies(req, res);

    cookieJar.set(cookie_name, cookie_value);
  };

  self._badRequest = function(res, message) {
      res.statusCode = 400;
      res.write(message);
      res.end();
  };
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
  }

  req.fm_session = existing_session;
  next();
};

/** Handle logon requests by processing form POST data and generating a FORMCRED cookie */
FakeMinder.prototype.logon = function(req, res, next, end) {
  var self = this,
      post_data = '',
      formcred,
      user,
      smagentname,
      log_msg;

  if (req.url !== this.config.siteminder().login_fcc && req.method !== "POST") {
    next();
    return;
  }

  req.on('data', function(data) {
    post_data += data;
  });

  req.on('end', function() {
    post_data = qs.parse(post_data);

    // If config dictates that an smagentname is required then validate against the POST data and return a 400 response if no good.
    smagentname = self.config.siteminder.smagentname;
    if (smagentname !== '' && smagentname !== post_data.smagentname) {
      log_msg = util.format('SMAGENTNAME of %s not supplied in logon POST data.', smagentname);
      log.info('fakeminder', log_msg);
      self._badRequest(res, log_msg);
      end();
      return;
    }

    formcred = new Model.FormCred();
    self.formcred[formcred.formcred_id] = formcred;
    self._setCookie(req, res, self.FORMCRED_COOKIE, formcred.formcred_id);

    // Search for the user, validate the password and set a status accordingly
    user = _.findWhere(self.config.users(), {'name': post_data.USERNAME});
    formcred.user = user;
    if (user) {
      if (user.password === post_data.PASSWORD) {
        formcred.status = Model.FormCredStatus.good_login;
        // Reset the login attempts for the user now they have successfully authenticated.
        user.login_attempts = 0;
      } else {
        log.info('fakeminder', 'User %s attempted login with bad password %s', user.name, post_data.PASSWORD);
        formcred.status = Model.FormCredStatus.bad_password;
      }
    } else {
      log.info('fakeminder', 'User with name %s not found', post_data.USERNAME);
      formcred.status = Model.FormCredStatus.bad_login;
    }

    self._redirectToUrl(res, post_data.TARGET);
    end();
  });
};

/** Handle requests for protected resources. If a login/password change is in process validate accordingly */
FakeMinder.prototype.protected = function(req, res, next, options) {
  var self = this,
      auth_headers,
      cookieJar = new Cookies(req, res),
      formcred_cookie = cookieJar.get(self.FORMCRED_COOKIE),
      formcred_session,
      existing_session,
      new_session,
      user,
      path_filter;

  // Exit from this function early if the URL is not 'protected'
  path_filter = pathfilter.getPathFilter(self.config.upstreamApp('sample_target'), req.url);
  log.info('fakeminder', 'Path filter match for URL %s => %s', req.url, util.inspect(path_filter));
  if (!path_filter.protected) {
    return next();
  }

  if (self.formcred) {
    formcred_session = self.formcred[formcred_cookie];
  }

  // Check the FORMCRED cookie if one exists and act accordingly
  if (_.isUndefined(formcred_session) === false) {
    log.verbose('fakeminder', 'Found existing FORMCRED session %s', formcred_session.formcred_id);
    // Remove for formcred session from self before doing any validation. FORMCRED is only a transient value that is not required after this step.
    delete(self.formcred[formcred_cookie]);

    if (formcred_session.user) {
      user = _.findWhere(this.config.users(), {'name':formcred_session.user.name});
      user = new Model.User(user);
      if (user && user.locked) {
        log.info('fakeminder', 'Account for user %s is currently locked', user.name);
        this._redirectTo(res, 'account_locked');
        return;
      }
    }

    switch (formcred_session.status) {
      // Login was successful
      case Model.FormCredStatus.good_login:
        for(var session in self.sessions) {
          if (self.sessions[session].name === formcred_session.name) {
            delete(self.sessions[session]);
            break;
          }
        }

        user.login_attempts = 0;
        user.save(this.config.users());

        new_session = new Model.Session(options);
        new_session.resetExpiration(this.config.siteminder().session_expiry_minutes);
        new_session.user = formcred_session.user;
        this._createNewSession(new_session);
        req.fm_session = new_session;
        log.info('fakeminder', 'New session %s created for user %s', new_session.session_id, user.name);
        break;

      case Model.FormCredStatus.bad_login:
        this._redirectTo(res, 'bad_login');
        return;

      case Model.FormCredStatus.bad_password:
        user.failedLogon(self.config.siteminder().max_login_attempts);
        user.save(this.config.users());

        if (user.locked) {
          this._redirectTo(res, 'account_locked');
        } else {
          this._redirectTo(res, 'bad_password');
        }

        return;
    }
  } else {
    if (_.isUndefined(req.fm_session) === true) {
      log.info('fakeminder', 'Session not found');
      this._redirectTo(res, 'not_authenticated');
      return;
    }

    if (req.fm_session.hasExpired()) {
      log.info('fakeminder', 'Session %s has expired', req.fm_session.session_id);
      this._redirectTo(res, 'not_authenticated');
      return;
    }
  }

  auth_headers = req.fm_session.user.auth_headers;

  // If there are auth_headers then add them to the request.
  if (auth_headers) {
    for (var header in auth_headers) {
      req.headers[header] = auth_headers[header];
    }
    log.verbose('fakeminder', 'Adding headers to request => %s',  util.inspect(auth_headers));
  }

  next();
};

FakeMinder.prototype.logoff = function(req, res, next) {
  var self = this,
      current_session = req.fm_session;

  if (req.url === self._getUrl('logoff')) {
    // Only set an SMSESSION cookie for protected resources the user has access to.
    if (current_session) {
      self._removeSession(current_session.session_id);
    }
    this._setCookie(req, res, self.SESSION_COOKIE, 'LOGGEDOFF');
    // Remove the current session from the request to prevent processing it further.
    delete(req['fm_session']);
  }

  next();
};

/** Set an SMSESSION cookie if required */
FakeMinder.prototype.end = function(req, res, next) {
  if (req.fm_session) {
    req.fm_session.resetExpiration(this.config.siteminder().session_expiry_minutes);
    this._setCookie(req, res, this.SESSION_COOKIE, req.fm_session.session_id);
    log.verbose('fakeminder', 'SessionID %s has expiration reset to %s', req.fm_session.session_id, req.fm_session.expiration);
  }

  next();
};

module.exports = FakeMinder;
