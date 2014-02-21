var expect = require('expect.js'),
    fs = require('fs'),
    sinon = require('sinon'),
    Config = require('../lib/config');

describe.only('Config', function() {
  var subject,
      fs_stub,
      config_json;

  beforeEach(function() {
    subject = new Config();
  });

  afterEach(function() {
    fs_stub.restore();
  });

  describe('#load', function() {
    it('loads the config JSON using the specified filename', function() {
      // Arrange
      var config_file = 'config.js';
      config_json = JSON.stringify({
        proxy: {},
        siteminder: {},
        target_site: {},
        users: []
      });
      fs_stub = sinon.stub(fs, 'readFileSync');
      fs_stub.withArgs(config_file, 'utf8').returns(config_json);

      // Act
      subject.load(config_file);

      // Assert
      expect(fs_stub.withArgs(config_file, 'utf8').calledOnce).to.be.ok();
    });

    it('saves the loaded config internally', function() {
      // Arrange
      var config_file = 'config.js';
      config_json = {
        proxy: {},
        siteminder: {},
        target_site: {},
        users: []
      };
      fs_stub = sinon.stub(fs, 'readFileSync');
      fs_stub.withArgs(config_file, 'utf8').returns(JSON.stringify(config_json));

      // Act
      subject.load(config_file);

      // Assert
      expect(subject._config).to.eql(config_json);
    });
  });

  describe('#pathFilters', function() {
    it('returns the set of path filters', function() {
      // Arrange
      var result;
      subject._config = {
        target_site: {
          url_protection: {
            protected_by_default: true,
            paths: [
              { url: '/protected', protected: true }
            ]
          }
        }
      };

      // Act
      result = subject.pathFilters();

      // Assert
      expect(result).to.eql(subject._config.target_site.url_protection);
    });
  });

  describe('#siteMinderRedirect', function() {
    it('returns the redirect matching the given name', function() {
      // Arrange
      var result;
      subject._config = {
        siteminder: {
          redirects: {
            logoff: 'foo',
            bad_login: 'bar'
          }
        }
      };

      // Act
      result = subject.siteMinderRedirect('logoff');

      // Assert
      expect(result).to.eql('foo');
    });
  });
});
