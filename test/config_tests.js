var expect = require('expect.js'),
    fs = require('fs'),
    sinon = require('sinon'),
    Config = require('../lib/config');

describe('Config', function() {
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
        upstreamApps: {},
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

  describe('#proxy', function() {
    it('returns the proxy configuration', function() {
      // Arrange
      var result;
      subject._config = {
        proxy: {
          protocol: 'http',
          host: 'localhost',
          port: 8000,
          upstreamApps: [
            'sample_target'
          ]
        }
      };

      // Act
      result = subject.proxy();

      // Assert
      expect(result).to.eql(subject._config.proxy);
    });
  });

  describe('#siteminder', function() {
    it('returns the SiteMinder configuration', function() {
      // Arrange
      var result;
      subject._config = {
        siteminder: {
          sm_cookie: 'SMSESSION',
          formcred_cookie: 'FORMCRED',
          userid_field: 'USERNAME',
          password_field: 'PASSWORD',
          target_field: 'TARGET',
          session_expiry_minutes: 20,
          max_login_attempts: 3,
          smagentname: 'ag-name1',
          login_fcc: '/public/siteminderagent/login.fcc',
        }
      };

      // Act
      result = subject.siteminder();

      // Assert
      expect(result).to.eql(subject._config.siteminder);
    });
  });

  describe('#upstreamApp', function() {
    it('returns the configuration for the upstream application identified by the given name', function() {
      // Arrange
      var result;
      subject._config = {
        upstreamApps: {
          'app2': {},
          'sample_target': {
            protocol: 'http',
            host: 'localhost',
            port: 4567,
            logoff: '/system/logout',
            not_authenticated: '/system/error/notauthenticated',
            bad_login: '/system/error/badlogin',
            bad_password: '/system/error/badpassword',
            account_locked: '/system/error/accountlocked',
            protected_by_default: false,
            path_filters: [
              { url: '/protected', protected: true }
            ]
          },
          'app1': {}
        }
      };

      // Act
      result = subject.upstreamApp('sample_target');

      // Assert
      expect(result).to.eql(subject._config.upstreamApps.sample_target);
    });
  });
});
