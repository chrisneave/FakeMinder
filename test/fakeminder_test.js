var assert = require('assert');
var expect = require('expect.js');
var fs = require('fs');
var Cookies = require('cookies');
var FakeMinder = require('../lib/fakeminder.js');
var Model = require('../lib/model.js');

describe('FakeMinder', function() {
  var subject,
      emptySession,
      request,
      response;

  beforeEach(function() {
    subject = new FakeMinder();
    emptySession = { 'user':'' };
    subject.config['siteminder'] = {
      'session_expiry_minutes':20
    };
    subject.config['target_site'] = {
      'root':'http://localhost:8000',
      'urls':{
        'logoff':'/system/logout',
        'not_authenticated':'/system/error/notauthenticated',
        'logon':'/public/logon',
        'protected':'/protected'
      }
    };

    request = {};
    response = {};
    request['method'] = 'GET';
    request['url'] = 'http://localhost:8000/';
    response['setHeader'] = function(header, value) {
      this.headers = this.headers || {};
      this.headers[header] = value;
    };
    // Stubs for supporting cookie.js
    request['connection'] = { 'encrypted':false };
    request['setHeader'] = function(header, value) {
      this.headers = this.headers || {};
      this.headers[header] = value;
    };
    request['headers'] = {};
    response['getHeader'] = function(header) {
      this.headers = this.headers || {};
      return this.headers[header];
    };
    response['end'] = function() {};
  });

  var findSession = function(sessions) {
    for (var session_id in subject.sessions) {
      if (subject.sessions[session_id].user.name === 'bob') {
        var found_session = subject.sessions[session_id];
        found_session['session_id'] = session_id;
        return found_session;
      }
    }
  };

  var getFmSession = function(request) {
    return request.fm_session;
  };

  it('parses the config.json file and writes it to the config property', function() {
    // Arrange
    var file = __dirname + '/../config.json';
    var json;
    var json = fs.readFileSync(file, 'utf8');
    json = JSON.parse(json);

    // Act
    subject = new FakeMinder();

    // Assert
    expect(subject.config).to.eql(json);
  });

  describe('#sessionInitializer()', function() {
    describe('when an SMSESSION cookie is not present', function() {
      it('sets fm_session to an empty object', function(done) {
        // Arrange
        var expected_value;

        // Act
        subject.sessionInitializer(request, response, function() {
          // Assert
          expect(request.fm_session).to.eql(expected_value);
          done();
        });
      });
    });

    describe('when an SMSESSION is present that does not match an existing session', function() {
      it('sets fm_session to an empty object', function(done) {
        // Arrange
        var expected_value;
        request.setHeader('cookie', 'SMSESSION=foo');

        // Act
        subject.sessionInitializer(request, response, function() {
          // Assert
          expect(request.fm_session).to.eql(expected_value);
          done();
        });
      })
    });

    describe('when an SMSESSION is present and matches an existing session', function() {
      it('sets fm_session to equal the matching session', function() {
        // Arrange
        var session = new Model.Session();
        subject.sessions[session.session_id] = session;
        request.setHeader('cookie', 'SMSESSION=' + session.session_id);

        // Act
        subject.sessionInitializer(request, response, function() {
          // Assert
          expect(request.fm_session).to.equal(session);
        });
      });
    });
  });

  describe('#logonHandler()', function() {
    var post_data;

    beforeEach(function() {
      request.url = subject.config.target_site.root + subject.config.target_site.urls.logon;
      request.method = 'POST';
      post_data = 'USERNAME=bob&PASSWORD=test1234&TARGET=https://localhost:8000/protected/home';
      request.on = function(event, callback) {
        if (event === 'data') {
          callback(post_data);
        }
        if (event === 'end') {
          callback();
        }
      }
    });

    describe('and the target URI belongs to the site being proxied', function() {
      it('redirects to the URI specified by the target URI');
    });

    describe('and the target URI does not belong to the site being proxied', function() {
      it('{determine what the correct behavior is}');
    });

    describe('and the USERNAME is not valid', function() {
      it('sets a FORMCRED cookie that maps to a bad login attempt');
    });

    describe('and the PASSWORD is not valid', function() {
      it('sets a FORMCRED cookie that maps to a bad password attempt');
    });

    describe('and the maximum number of login attempts is reached', function() {
      it('sets a FORMCRED cookie that maps to a failed number of login attempts');
    });

    describe('when the request is a GET for the login URI', function() {
      it('returns a 400 response');
    });
  });

  describe('#protectedHandler()', function() {
    beforeEach(function() {
      // Arrange
      request.url = 'http://localhost:8000/protected/home';
      var user_bob = new Model.User('bob', 'test1234', {'header1':'auth1', 'header2':'auth2', 'header3':'auth3'});
      subject.config.users[user_bob.name] = user_bob;
    });

    describe('and there is no current session', function() {
      it('redirects the user to the Not Authenticated URI', function() {
        // Arrange
        request.url = 'http://localhost:8000/protected';

        // Act
        subject.protectedHandler(request, response);

        // Assert
        expect(response.statusCode).to.be(302);
        expect(response.headers['Location']).to.be('http://localhost:8000/system/error/notauthenticated');
      });
    });

    describe('and there is a current session', function() {
      beforeEach(function() {
        var now = new Date();
        var sessionExpiry = new Date(now.getTime() - 10 * 60000);
        var session = new Model.Session('xyz', new Model.User('bob'), sessionExpiry.toJSON());
        request.fm_session = session;
        session.user.auth_headers['header1'] = 'auth1';
        session.user.auth_headers['header2'] = 'auth2';
        session.user.auth_headers['header3'] = 'auth3';
        subject.sessions[session.session_id] = session;
      });

      it('adds identity headers to the forwarded request', function(done) {
        // Act
        subject.protectedHandler(request, response, function() {
          // Assert
          expect(request.headers['header1']).to.equal('auth1');
          expect(request.headers['header2']).to.equal('auth2');
          expect(request.headers['header3']).to.equal('auth3');
          done();
        });
      });

      it('forwards the request to the proxy', function(done) {
        // Act
        subject.protectedHandler(request, response, function() {
          // Assert
          done();
        });
      });

      it('Sets the SMSESSION cookie to the session ID, domain being proxied and sets HttpOnly to true', function(done) {
        // Act
        subject.protectedHandler(request, response, function() {
          // Assert
          expect(response.headers['set-cookie']).to.contain('SMSESSION=xyz; path=/; domain=localhost; httponly');
          done();
        });
      });
    });

    describe('and the request contains a FORMCRED cookie related to a valid login attempt', function() {
      beforeEach(function() {
        var formcred = new Model.FormCred('fc123', new Model.User('bob'), Model.FormCredStatus.good_login);
        subject.formcred[formcred.formcred_id] = formcred;
        request.setHeader('cookie', 'FORMCRED=' + formcred.formcred_id);
      });

      it('destroys any existing session for the user', function(done) {
        // Arrange
        var session = new Model.Session('xyz', new Model.User('bob'));
        subject.sessions[session.session_id] = session;

        // Act
        subject.protectedHandler(request, response, function() {
          // Assert
          expect(subject.sessions).to.not.have.key(session.session_id);
          done();
        });
      });

      it('creates a new session for the user', function(done) {
        // Arrange
        subject.sessions = {};

        // Act
        subject.protectedHandler(request, response, function() {
          // Assert
          expect(findSession()).to.be.ok();
          done();
        });
      });

      it('sets the new session to expire after the configured timeout', function(done) {
        // Arrange
        subject.sessions = {};
        var now = new Date();
        var session_expiry = new Date(now.getTime() + subject.config.siteminder.session_expiry_minutes * 60000);

        // Act
        subject.protectedHandler(request, response, function() {
          var session_expired_date = new Date(findSession().expiration);
          expect(session_expired_date.getFullYear()).to.equal(session_expiry.getFullYear());
          expect(session_expired_date.getMonth()).to.equal(session_expiry.getMonth());
          expect(session_expired_date.getDay()).to.equal(session_expiry.getDay());
          expect(session_expired_date.getHours()).to.equal(session_expiry.getHours());
          expect(session_expired_date.getMinutes()).to.equal(session_expiry.getMinutes());
          expect(session_expired_date.getSeconds()).to.equal(session_expiry.getSeconds());
          done();
        });
      });

      it('creates a new session with a 16 byte hexadecimal string session_id value', function(done) {
        // Arrange
        subject.sessions = {};
        var now = new Date();
        var session_expiry = new Date(now.getTime() + subject.config.siteminder.session_expiry_minutes * 60000);

        // Act
        subject.protectedHandler(request, response, function() {
          expect(findSession().session_id).to.match(/^([0-9a-fA-F]{2}){16}$/);
          done();
        });
      });
    });

    describe('and the FORMCRED cookie maps to a bad login', function() {
      it('responds with a redirect to the bad login URI');
    });

    describe('and the FORMCRED cookie maps to a bad password', function() {
      it('responds with a redirect to the bad password URI');
      it('increments the number of login attempts associated with the user');
    });

    describe('and the FORMCRED cookie maps to a failed number of login attempts', function() {
      it('responds with a redirect to the account locked URI');
    });
  });

  describe('#logoffHandler()', function() {
    describe('when the logoff URI is requested', function() {
      it('adds an SMSESSION cookie with a value of LOGGEDOFF to the response', function(done) {
        // Arrange
        request.url = 'http://localhost:8000/system/logout';
        request.fm_session = {};

        // Act
        subject.logoffHandler(request, response, function() {
          var cookies = response.headers['set-cookie'];

          // Assert
          expect(cookies[0]).to.contain('SMSESSION=LOGGEDOFF');
          done();
        });
      });

      it('removes the existing session corresponding to the SMSESSION cookie value', function(done) {
        // Arrange
        request.url = 'http://localhost:8000/system/logout';
        subject.sessions = {'session1':{}, 'session2':{}, 'session3':{}};
        request.fm_session = {smsession: 'session2'};

        // Act
        subject.logoffHandler(request, response, function() {
          // Assert
          expect(subject.sessions).to.not.have.key('session2');
          done();
        });
      });
    });
  });

  describe('#sessionFinalizer()', function() {
    it('adds an x-proxied-by header value to the request', function(done) {
      // Arrange
      // Act
      subject.sessionFinalizer(request, response, function() {
        // Assert
        expect(request.headers['x-proxied-by']).to.equal('localhost:8000');
        done();       
      });
    });

    it('adds an x-proxied-by header to the response', function(done) {
      // Arrange
      // Act
      subject.sessionFinalizer(request, response, function() {
        // Assert
        expect(response.headers['x-proxied-by']).to.equal('localhost:8000');
        done();       
      });
    });
    
    it('resets the expiration of the session', function(done) {
      // Arrange
      var now = new Date();
      var expected_expiry;
      var session = new Model.Session();
      session.user = new Model.User('bob');
      subject.sessions[session.session_id] = session;
      request.fm_session = session;

      // Act
      subject.sessionFinalizer(request, response, function() {
        var session_expired_date = new Date(subject.sessions[session.session_id].expiration);
        expected_expiry = new Date(now.getTime() + subject.config.siteminder.session_expiry_minutes * 60000);

        // Assert
        expect(session_expired_date.getFullYear()).to.equal(expected_expiry.getFullYear());
        expect(session_expired_date.getMonth()).to.equal(expected_expiry.getMonth());
        expect(session_expired_date.getDay()).to.equal(expected_expiry.getDay());
        expect(session_expired_date.getHours()).to.equal(expected_expiry.getHours());
        expect(session_expired_date.getMinutes()).to.equal(expected_expiry.getMinutes());
        expect(session_expired_date.getSeconds()).to.equal(expected_expiry.getSeconds());
        done();
      });
    });
  });
});