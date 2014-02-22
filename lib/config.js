var fs = require('fs');

var Proxy = function(config) {
  var self = this;

  self.protocol = config.protocol || 'http';
  self.host = config.host;
  self.port = config.port;
  self.upstreamApps = config.upstreamApps;
};

var UpstreamApp = function(name, config) {
  var self = this;

  self.name = name;
};

var SiteMinder = function(config) {
  var self = this;

  self.sm_cookie = config.sm_cookie || "SMSESSION";
  self.formcred_cookie = config.formcred_cookie || "FORMCRED";
  self.userid_field = config.userid_field || "USERNAME";
  self.password_field = config.password_field || "PASSWORD";
  self.target_field = config.target_field || "TARGET";
  self.session_expiry_minutes = config.session_expiry_minutes || 20;
  self.max_logon_attempts = config.max_logon_attempts || 3;
  self.smagentname = config.smagentname || "";
  self.login_fcc = config.login_fcc || "/public/siteminderagent/login.fcc";
};

var Config = function() {
  var self = this;
  this._config = {};

  this.load = function(filename) {
    self._config = JSON.parse(fs.readFileSync(filename, 'utf8'));
  };

  this.pathFilters = function() {
    return self._config.target_site.url_protection;
  };

  this.siteMinderRedirect = function(name) {
    return self._config.siteminder.redirects[name];
  };

  this.proxy = function() {
    return self._config.proxy;
  };

  this.siteminder = function() {
    return self._config.siteminder;
  };

  this.upstreamApp = function(name) {
    return self._config.upstreamApps[name];
  };
};

module.exports = Config;