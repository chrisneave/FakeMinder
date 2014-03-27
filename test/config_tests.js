var expect = require('expect.js'),
    fs = require('fs'),
    sinon = require('sinon'),
    Config = require('../lib/config');

describe('Config', function() {
  var subject,
      fs_stub,
      config_json,
      config_file = 'config.js';


  beforeEach(function() {
    config_json = JSON.stringify({
      proxy: {
        port: 8000,
        upstreamApps: [
          'sample_target'
        ]
      },
      siteminder: {
        sm_cookie: 'SMSESSION',
        sm_cookie_domain: 'fizz.buzz.com',
        formcred_cookie: 'FORMCRED',
        formcred_cookie_domain: 'foo.bar.com',
        userid_field: 'USERNAME',
        password_field: 'PASSWORD',
        target_field: 'TARGET',
        session_expiry_minutes: 20,
        max_login_attempts: 3,
        smagentname: 'ag-name1',
        login_fcc: '/public/siteminderagent/login.fcc',
      },
      upstreamApps: {
        'app2': {},
        'sample_target': {
          proxy_pass: 'http://localhost:8000',
          hostname: 'localhost',
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
      },
      users: []
    });

    subject = new Config();
  });

  afterEach(function() {
    fs_stub.restore();
  });

  describe('#load', function() {
    it('loads the config JSON using the specified filename', function() {
      // Arrange
      fs_stub = sinon.stub(fs, 'readFileSync');
      fs_stub.withArgs(config_file, 'utf8').returns(config_json);

      // Act
      subject.load(config_file);

      // Assert
      expect(fs_stub.withArgs(config_file, 'utf8').calledOnce).to.be.ok();
    });

    it('saves the loaded config internally', function() {
      // Arrange
      fs_stub = sinon.stub(fs, 'readFileSync');
      fs_stub.withArgs(config_file, 'utf8').returns(JSON.stringify(config_json));

      // Act
      subject.load(config_file);

      // Assert
      expect(subject._config).to.eql(config_json);
    });

    it('loads the proxy configuration', function() {
      // Arrange
      var expected = JSON.parse(config_json).proxy;
      fs_stub = sinon.stub(fs, 'readFileSync');
      fs_stub.returns(config_json);

      // Act
      subject.load();

      // Assert
      expect(subject.proxy()).to.eql(expected);
    });

    it('loads the SiteMinder configuration', function() {
      // Arrange
      var expected = JSON.parse(config_json).siteminder;
      fs_stub = sinon.stub(fs, 'readFileSync');
      fs_stub.returns(config_json);

      // Act
      subject.load();

      // Assert
      expect(subject.siteminder()).to.eql(expected);
    });

    it('loads the upstreamApps configuration', function() {
      // Arrange
      var expected = JSON.parse(config_json).upstreamApps['sample_target'];
      fs_stub = sinon.stub(fs, 'readFileSync');
      fs_stub.returns(config_json);

      // Act
      subject.load();

      // Assert
      expect(subject.upstreamApp('sample_target')).to.eql(expected);
    });

    it('loads the users', function() {
      // Arrange
      var expected = JSON.parse(config_json).users;
      fs_stub = sinon.stub(fs, 'readFileSync');
      fs_stub.returns(config_json);

      // Act
      subject.load();

      // Assert
      expect(subject.users()).to.eql(expected);
    });
  });

  describe('#proxy', function() {
    it('returns the proxy configuration', function() {
      // Arrange
      var result;
      subject._config = JSON.parse(config_json);

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
      subject._config = JSON.parse(config_json);

      // Act
      result = subject.siteminder();

      // Assert
      expect(result).to.eql(subject._config.siteminder);
    });
  });

  describe('#upstreamApp', function() {
    it('returns the configuration for the upstream application identified by the given name', function() {
      // Arrange
      subject._config = JSON.parse(config_json);
      var result;

      // Act
      result = subject.upstreamApp('sample_target');

      // Assert
      expect(result).to.eql(subject._config.upstreamApps.sample_target);
    });
  });
});
