var assert = require('assert'),
    expect = require('expect.js'),
    fs = require('fs'),
    url = require('url'),
    cookie = require('cookie'),
    _ = require('underscore'),
    FakeMinder = require('../lib/fakeminder.js'),
    Model = require('../lib/model.js');

describe('FakeMinder', function() {
  var subject,
      emptySession,
      request,
      response;

  beforeEach(function() {
    subject = new FakeMinder('config.json');
    emptySession = { 'user':'' };
    request = {};
    response = {};
    request['method'] = 'GET';
    request['url'] = '/';
    response['setHeader'] = function(header, value) {
      this.headers = this.headers || {};
      this.headers[header] = value;
    };
    // Stubs for supporting cookie.js
    request['connection'] = { 'encrypted':false };
    request['headers'] = {};
    response['headers'] = {};
    response['getHeader'] = function(header) {
      this.headers = this.headers || {};
      return this.headers[header];
    };
    response['end'] = function() {};
    response['write'] = function(content) {
      this['body'] = content;
    };
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

  var getTargetSiteUrl = function(url_type) {
    return subject.config.target_site.pathnames[url_type];
  };

  it('parses the config.json file and writes it to the config property', function() {
    // Arrange
    var file = __dirname + '/../config.json';
    var json = fs.readFileSync(file, 'utf8');
    json = JSON.parse(json);

    // Act
    subject = new FakeMinder('config.json');

    // Assert
    expect(subject.config).to.eql(json);
  });

  describe('init()', function() {
    describe('when an SMSESSION cookie is not present', function() {
      it('sets fm_session to an empty object', function(done) {
        // Arrange
        var expected_value;

        // Act
        subject.init(request, response, function() {
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
        request.headers['cookie'] = 'SMSESSION=foo';

        // Act
        subject.init(request, response, function() {
          // Assert
          expect(request.fm_session).to.eql(expected_value);
          done();
        });
      });
    });

    describe('when an SMSESSION is present and matches an existing session', function() {
      it('sets fm_session to equal the matching session', function() {
        // Arrange
        var session = new Model.Session();
        subject.sessions[session.session_id] = session;
        request.headers['cookie'] = 'SMSESSION=' + session.session_id;

        // Act
        subject.init(request, response, function() {
          // Assert
          expect(request.fm_session).to.equal(session);
        });
      });
    });
  });

  describe('logon()', function() {
    var post_data,
        target = 'http://localhost:8000/protected/home',
        user;

    beforeEach(function() {
      request.url = subject.config.target_site.pathnames.logon;
      request.method = 'POST';
      user = 'bob';
      post_data = 'USERNAME=' + user + '&PASSWORD=test1234&TARGET=' + target;
      request.on = function(event, callback) {
        if (event === 'data') {
          callback(post_data);
        }
        if (event === 'end') {
          callback();
        }
      };
    });

    describe('and the target URI belongs to the site being proxied', function() {
      it('redirects to the URI specified by the target URI', function(done) {
        // Arrange
        // Act
        subject.logon(request, response, undefined, function() {
          // Assert
          expect(response.statusCode).to.be(302);
          expect(response.headers['Location']).to.equal(target);
          done();
        });
      });
    });

    describe('and the target URI does not belong to the site being proxied', function() {
      it('{determine what the correct behavior is}');
    });

    describe('and the smagentname field is specified in config', function() {
      describe('and the form does not contain a matching smagentname value', function() {
        it('returns a 400 response', function(done) {
          // Arrange
          subject.config.siteminder.smagentname = "custom_agent";
          post_data = 'USERNAME=' + user + '&PASSWORD=test1234&TARGET=' + target + "&SMAGENTNAME=blah";

          // Act
          subject.logon(request, response, undefined, function() {
            // Assert
            expect(response.statusCode).to.be(400);
            expect(response.body).to.equal('SMAGENTNAME of "custom_agent" not supplied in logon POST data.');
            done();
          });
        });
      });

      describe('and the form does not contain a an smagentname value', function() {
        it('returns a 400 response', function(done) {
          // Arrange
          subject.config.siteminder.smagentname = "custom_agent";
          post_data = 'USERNAME=' + user + '&PASSWORD=test1234&TARGET=' + target;

          // Act
          subject.logon(request, response, undefined, function() {
            // Assert
            expect(response.statusCode).to.be(400);
            expect(response.body).to.equal('SMAGENTNAME of "custom_agent" not supplied in logon POST data.');
            done();
          });
        });
      });
    });

    describe('and the USERNAME and PASSWORD are valid', function() {
      it('sets a FORMCRED cookie that maps to a good login attempt', function(done) {
        // Arrange
        // Act
        subject.logon(request, response, undefined, function() {
          // Assert
          var cookies = cookie.parse(response.headers['set-cookie'][0]);
          var formcred_id = cookies[subject.FORMCRED_COOKIE];
          expect(subject.formcred[formcred_id].status).to.equal(Model.FormCredStatus.good_login);
          done();
        });
      });

      it('creates a new FORMCRED that maps to the user', function(done) {
        // Arrange
        var expected = _.findWhere(subject.config.users, {'name': user});

        // Act
        subject.logon(request, response, undefined, function() {
          // Assert
          var cookies = cookie.parse(response.headers['set-cookie'][0]);
          var formcred_id = cookies[subject.FORMCRED_COOKIE];
          expect(subject.formcred[formcred_id].user).to.equal(expected);
          done();
        });
      });

      it('resets the login_attempts for the user back to zero', function(done) {
        // Arrange
        var expected = _.findWhere(subject.config.users, {'name': user});
        expected.login_attempts = 2;

        // Act
        subject.logon(request, response, undefined, function() {
          // Assert
          expect(expected.login_attempts).to.equal(0);
          done();
        });
      });
    });

    describe('and the USERNAME is not valid', function() {
      it('sets a FORMCRED cookie that maps to a bad login attempt', function(done) {
        // Arrange
        post_data = 'USERNAME=fred&PASSWORD=test1234&TARGET=' + target;

        // Act
        subject.logon(request, response, undefined, function() {
          // Assert
          var cookies = cookie.parse(response.headers['set-cookie'][0]);
          var formcred_id = cookies[subject.FORMCRED_COOKIE];
          expect(subject.formcred[formcred_id].status).to.equal(Model.FormCredStatus.bad_login);
          done();
        });
      });
    });

    describe('and the PASSWORD is not valid', function() {
      it('sets a FORMCRED cookie that maps to a bad password attempt', function(done) {
        // Arrange
        post_data = 'USERNAME=' + user + '&PASSWORD=foobar1&TARGET=' + target;

        // Act
        subject.logon(request, response, undefined, function() {
          // Assert
          var cookies = cookie.parse(response.headers['set-cookie'][0]);
          var formcred_id = cookies[subject.FORMCRED_COOKIE];
          expect(subject.formcred[formcred_id].status).to.equal(Model.FormCredStatus.bad_password);
          done();
        });
      });
    });
  });

  describe('protected()', function() {
    beforeEach(function() {
      // Arrange
      request.url = '/protected';
      var user_bob = new Model.User({
        'name': 'bob',
        'password': 'test1234',
        'auth_headers': {'header1':'auth1', 'header2':'auth2', 'header3':'auth3'}
      });
      subject.config.users[user_bob.name] = user_bob;
    });

    describe('and there is no current session', function() {
      it('redirects the user to the not_authenticated URL', function() {
        // Arrange
        // Act
        subject.protected(request, response, function() {});

        // Assert
        expect(response.statusCode).to.be(302);
        expect(response.headers['Location']).to.be(getTargetSiteUrl('not_authenticated'));
      });
    });

    describe('and there is a current session', function() {
      beforeEach(function() {
        var now = new Date();
        var sessionExpiry = new Date(now.getTime() + 10 * 60000);
        var session = new Model.Session({
          'session_id': 'xyz',
          'user': new Model.User({'name': 'bob'}),
          'expiration': sessionExpiry.toJSON()
        });
        request.fm_session = session;
        session.user.auth_headers['header1'] = 'auth1';
        session.user.auth_headers['header2'] = 'auth2';
        session.user.auth_headers['header3'] = 'auth3';
        subject.sessions[session.session_id] = session;
      });

      it('adds identity headers to the forwarded request', function(done) {
        // Act
        subject.protected(request, response, function() {
          // Assert
          expect(request.headers['header1']).to.equal('auth1');
          expect(request.headers['header2']).to.equal('auth2');
          expect(request.headers['header3']).to.equal('auth3');
          done();
        });
      });

      it('forwards the request to the proxy', function(done) {
        // Act
        subject.protected(request, response, function() {
          // Assert
          done();
        });
      });

      it('handles a request not matching the first configured protected URL', function() {
        // Arrange
        request.url = '/really_private/secure/info';

        // Act
        subject.protected(request, response, function() {});

        // Assert
        expect(request.headers['header1']).to.equal('auth1');
      });

      it('handles a request not matching the first configured public URL', function() {
        // Arrange
        request.url = '/wide_open/verypublic';

        // Act
        subject.protected(request, response, function() {});

        // Assert
        expect(request.headers).to.be.empty();
      });
    });

    describe('and there is an expired session', function() {
      it('redirects the user-agent to the not_authenticated URL', function() {
        // Arrange
        request.url = '/protected';
        var now = new Date();
        var sessionExpiry = new Date(now.getTime() - 120 * 60000);
        var session = new Model.Session({
          'session_id': 'xyz',
          'user': new Model.User({'name': 'bob'}),
          'expiration': sessionExpiry.toJSON()
        });
        request.fm_session = session;
        subject.sessions[session.session_id] = session;

        // Act
        subject.protected(request, response, function() {});

        // Assert
        expect(response.statusCode).to.be(302);
        expect(response.headers['Location']).to.be(getTargetSiteUrl('not_authenticated'));
      });
    });

    describe('and the request contains a FORMCRED cookie related to a valid login attempt', function() {
      var formcred;

      beforeEach(function() {
        formcred = new Model.FormCred({
          'formcred_id': 'fc123',
          'user': new Model.User({'name': 'bob'}),
          'status': Model.FormCredStatus.good_login
        });
        subject.formcred[formcred.formcred_id] = formcred;
        request.headers['cookie'] = 'FORMCRED=' + formcred.formcred_id;
      });

      describe('and the user associated with the FORMCRED is currently locked', function() {
        it('responds with a redirect to the account locked URI', function() {
          // Arrange
          subject.config.users[0].locked = true;

          // Act
          subject.protected(request, response, function() {});

          // Assert
          expect(response.statusCode).to.be(302);
          expect(response.headers['Location']).to.be(getTargetSiteUrl('account_locked'));
        });
      });

      it('destroys any existing session for the user', function(done) {
        // Arrange
        var session = new Model.Session({
          'session_id': 'xyz',
          'user': new Model.User({'name': 'bob'})
        });
        subject.sessions[session.session_id] = session;

        // Act
        subject.protected(request, response, function() {
          // Assert
          expect(subject.sessions).to.not.have.key(session.session_id);
          done();
        });
      });

      it('creates a new session for the user', function(done) {
        // Arrange
        subject.sessions = {};

        // Act
        subject.protected(request, response, function() {
          // Assert
          expect(findSession()).to.be.ok();
          done();
        });
      });

      it('adds the new session to the request object', function(done) {
        // Arrange
        subject.sessions = {};

        // Act
        subject.protected(request, response, function() {
          // Assert
          expect(request.fm_session).to.be.equal(findSession());
          done();
        });
      });

      it('sets the new session to expire after the configured timeout', function(done) {
        // Arrange
        subject.sessions = {};
        var now = new Date();
        var session_expiry = new Date(now.getTime() + subject.config.siteminder.session_expiry_minutes * 60000);

        // Act
        subject.protected(request, response, function() {
          var session_expired_date = new Date(findSession().expiration);
          expect(session_expired_date.getFullYear()).to.equal(session_expiry.getFullYear());
          expect(session_expired_date.getMonth()).to.equal(session_expiry.getMonth());
          expect(session_expired_date.getDay()).to.equal(session_expiry.getDay());
          expect(session_expired_date.getHours()).to.equal(session_expiry.getHours());
          expect(session_expired_date.getMinutes()).to.equal(session_expiry.getMinutes());
          expect(session_expired_date.getSeconds()).to.equal(session_expiry.getSeconds());
          done();
        }, {now: now});
      });

      it('creates a new session with a 16 byte hexadecimal string session_id value', function(done) {
        // Arrange
        subject.sessions = {};
        var now = new Date();
        var session_expiry = new Date(now.getTime() + subject.config.siteminder.session_expiry_minutes * 60000);

        // Act
        subject.protected(request, response, function() {
          expect(findSession().session_id).to.match(/^([0-9a-fA-F]{2}){16}$/);
          done();
        });
      });

      it('destroys the formcred session', function(done) {
        // Arrange
        var session = new Model.Session({
          'session_id': 'xyz',
          'user': new Model.User({'name':' bob'})
        });
        subject.sessions[session.session_id] = session;

        // Act
        subject.protected(request, response, function() {
          // Assert
          expect(subject.formcred).to.not.have.key(formcred.formcred_id);
          done();
        });
      });

      it('resets the login_attempts for the user back to zero', function(done) {
        subject.config.users[0].login_attempts = 2;

        subject.protected(request, response, function() {
          expect(subject.config.users[0].login_attempts).to.equal(0);
          done();
        });
      });
    });

    describe('and the FORMCRED cookie maps to a bad login', function() {
      var user,
          formcred;

      beforeEach(function() {
        user = new Model.User({'name': 'bob'});
        formcred = new Model.FormCred({
          'formcred_id': 'fc123',
          'user': user,
          'status': Model.FormCredStatus.bad_login
        });
        subject.formcred[formcred.formcred_id] = formcred;
        request.headers['cookie'] = 'FORMCRED=' + formcred.formcred_id;
        subject.config.users = [user];
      });

      it('responds with a redirect to the bad login URI', function() {
        // Arrange
        // Act
        subject.protected(request, response, function() {});

        // Assert
        expect(response.statusCode).to.be(302);
        expect(response.headers['Location']).to.be(getTargetSiteUrl('bad_login'));
      });

      it('destroys the formcred session', function() {
        // Arrange
        // Act
        subject.protected(request, response, function() {});

        // Assert
        expect(subject.formcred).to.not.have.key(formcred.formcred_id);
      });
    });

    describe('and the FORMCRED cookie maps to a bad password', function() {
      var user,
          formcred;

      beforeEach(function() {
        user = new Model.User({'name': 'bob'});
        formcred = new Model.FormCred({
          'formcred_id': 'fc123',
          'user': user,
          'status': Model.FormCredStatus.bad_password
        });
        subject.formcred[formcred.formcred_id] = formcred;
        request.headers['cookie'] = 'FORMCRED=' + formcred.formcred_id;
      });

      it('responds with a redirect to the bad password URI', function() {
        // Arrange

        // Act
        subject.protected(request, response, function() {});

        // Assert
        expect(response.statusCode).to.be(302);
        expect(response.headers['Location']).to.be(getTargetSiteUrl('bad_password'));
      });

      it('increments the number of login attempts associated with the user', function() {
        // Arrange

        // Act
        subject.protected(request, response, function() {});

        // Assert
        expect(subject.config.users[0].login_attempts).to.equal(1);
      });

      describe('and the user has exceeded the maximum number of login attempts', function() {
        it('locks the user\'s account', function() {
          // Arrange
          subject.config.users[0].login_attempts = 2;

          // Act
          subject.protected(request, response, function() {});

          // Assert
          expect(subject.config.users[0].locked).to.be.ok();
        });
      });

      describe('and the user\'s account is locked', function() {
        it('responds with a redirect to the account locked URI', function() {
          // Arrange
          subject.config.users[0].locked = true;

          // Act
          subject.protected(request, response, function() {});

          // Assert
          expect(response.statusCode).to.be(302);
          expect(response.headers['Location']).to.be(getTargetSiteUrl('account_locked'));
        });
      });

      it('destroys the formcred session', function() {
        // Arrange
        // Act
        subject.protected(request, response, function() {});

        // Assert
        expect(subject.formcred).to.not.have.key(formcred.formcred_id);
      });
    });

    describe('and the request is not for a protected folder', function() {
      it('invokes the next middleware', function(done) {
        // Arrange
        request.url = '/public';

        // Act & assert
        subject.protected(request, response, done);
      });

      it('destroys the formcred session', function() {
        // Arrange
        var user = new Model.User({'name': 'bob'});
        var formcred = new Model.FormCred({
          'formcred_id': 'fc123',
          'user': user,
          'status': Model.FormCredStatus.bad_password
        });

        // Act
        subject.protected(request, response, function() {});

        // Assert
        expect(subject.formcred).to.not.have.key(formcred.formcred_id);
      });
    });
  });

  describe('logoff()', function() {
    describe('when the logoff URI is requested', function() {
      it('adds an SMSESSION cookie with a value of LOGGEDOFF to the response', function(done) {
        // Arrange
        request.url = '/system/logout';

        // Act
        subject.logoff(request, response, function() {
          var cookies = response.headers['set-cookie'];

          // Assert
          expect(cookies[0]).to.contain('SMSESSION=LOGGEDOFF');
          done();
        });
      });

      it('removes the existing session corresponding to the SMSESSION cookie value', function(done) {
        // Arrange
        request.url = '/system/logout';
        var session = new Model.Session({'session_id': 'session2'});
        subject.sessions = {'session1':{}, 'session2':session, 'session3':{}};
        request.fm_session = session;

        // Act
        subject.logoff(request, response, function() {
          // Assert
          expect(subject.sessions).to.not.have.key('session2');
          done();
        });
      });
    });

    describe('when the logoff URI is not requested', function() {
    });
  });

  describe('end()', function() {
    describe('if set_x_proxied_by is set to true', function() {
      it('adds an x-proxied-by header value to the request', function(done) {
        // Arrange
        subject.config.proxy.url = 'http://somehost:3245';
        subject.config.proxy.set_x_proxied_by = true;

        // Act
        subject.end(request, response, function() {
          // Assert
          expect(request.headers['x-proxied-by']).to.equal('somehost:3245');
          done();
        });
      });

      it('adds an x-proxied-by header to the response', function(done) {
        // Arrange
        subject.config.proxy.url = 'http://somehost:3245';
        subject.config.proxy.set_x_proxied_by = true;

        // Act
        subject.end(request, response, function() {
          // Assert
          expect(response.headers['x-proxied-by']).to.equal('somehost:3245');
          done();
        });
      });
    });

    describe('if set_x_proxied_by is set to false', function() {
      it('does not add an x-proxied-by header value to the request', function(done) {
        // Arrange
        subject.config.proxy.set_x_proxied_by = false;

        // Act
        subject.end(request, response, function() {
          // Assert
          expect(response.headers).to.not.have.key('x-proxied-by');
          done();
        });
      });

      it('does not add an x-proxied-by header to the response', function(done) {
        // Arrange
        subject.config.proxy.set_x_proxied_by = false;

        // Act
        subject.end(request, response, function() {
          // Assert
          expect(response.headers).to.not.have.key('x-proxied-by');
          done();
        });
      });
    });

    it('resets the expiration of the session', function(done) {
      // Arrange
      var now = new Date();
      var expected_expiry;
      var session = new Model.Session({'user': new Model.User({'name': 'bob'}), 'now': now});
      subject.sessions[session.session_id] = session;
      request.fm_session = session;

      // Act
      subject.end(request, response, function() {
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

    it('sets the SMSESSION cookie containing the ID of the current session', function(done) {
      // Arrange
      var session = new Model.Session({'user': new Model.User({'name': 'bob'})});
      subject.sessions[session.session_id] = session;
      request.fm_session = session;

      // Act
      subject.end(request, response, function() {
        // Assert
        var cookies = response.headers['set-cookie'];

        // Assert
        expect(cookies[0]).to.contain('SMSESSION=' + session.session_id);
        done();
      });
    });
  });

  describe('rewriteResponse()', function() {
    it('rewrites the Location header to match that of the proxy server', function() {
      // Arrange
      response.headers['Location'] = subject.config.target_site.url;
      var expected = subject.config.proxy.url;

      // Act
      subject.rewriteResponse(response);

      // Assert
      expect(response.headers['Location']).to.equal(expected);
    });
  });
});