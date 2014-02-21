var fs = require('fs');

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
};

module.exports = Config;