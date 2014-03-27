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

var fs = require('fs');

var Proxy = function(config) {
  var self = this;

  self.port = config.port;
  self.upstreamApps = config.upstreamApps;
};

var UpstreamApp = function(name, config) {
  var self = this;

  self.proxy_pass = config.proxy_pass;
  self.hostname = config.hostname;
  self.port = config.port;
  self.logoff = config.logoff;
  self.not_authenticated = config.not_authenticated;
  self.bad_login = config.bad_login;
  self.bad_password = config.bad_password;
  self.account_locked = config.account_locked;
  self.protected_by_default = config.protected_by_default;
  self.path_filters = config.path_filters;
};

var SiteMinder = function(config) {
  var self = this;

  self.sm_cookie = config.sm_cookie || "SMSESSION";
  self.sm_cookie_domain = config.sm_cookie_domain;
  self.formcred_cookie = config.formcred_cookie || "FORMCRED";
  self.formcred_cookie_domain = config.formcred_cookie_domain;
  self.userid_field = config.userid_field || "USERNAME";
  self.password_field = config.password_field || "PASSWORD";
  self.target_field = config.target_field || "TARGET";
  self.session_expiry_minutes = config.session_expiry_minutes || 20;
  self.max_login_attempts = config.max_login_attempts || 3;
  self.smagentname = config.smagentname || "";
  self.login_fcc = config.login_fcc || "/public/siteminderagent/login.fcc";
};

var Config = function() {
  var self = this;
  this._config = {};

  this.load = function(filename) {
    self._config = JSON.parse(fs.readFileSync(filename, 'utf8'));
  };

  this.proxy = function() {
    return new Proxy(self._config.proxy);
  };

  this.siteminder = function() {
    return new SiteMinder(self._config.siteminder);
  };

  this.upstreamApp = function(name) {
    return new UpstreamApp(name, self._config.upstreamApps[name]);
  };

  this.users = function() {
    return self._config.users;
  };
};

module.exports = Config;