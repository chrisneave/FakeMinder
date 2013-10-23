var assert = require('assert');
var expect = require('expect.js');
var fs = require('fs');
var Cookies = require('cookies');
var FakeMinder = require('../lib/fakeminder.js');

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

  it('it has an empty session', function() {
    // Act
    var emptySession = subject.emptySession;

    // Assert
    expect(emptySession).to.eql({'user':''});
  });

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

  describe('#handleRequest()', function() {
    it('adds a "x-proxied-by" header value with the host/port value of the proxy', function(done) {
      // Arrange

      // Act
      subject.handleRequest(request, response, function() {
        // Assert
        expect(response.headers).to.be.ok();
        expect(response.headers).to.have.key('x-proxied-by');
        expect(response.headers['x-proxied-by']).to.equal('localhost:8000');
        done();       
      });
    });

    describe('when the request is not for a protected URI', function() {
      it('proxies the request', function(done) {
        // Arrange
        request.url = 'http://localhost:8000/public/home';

        // Act
        var proxied = subject.handleRequest(request, response, function(proxied) {
          // Assert
          expect(proxied).to.be.ok();
          done();
        });
      });

      it('does not set an SMSESSION cookie in the response', function(done) {
        // Arrange
        request.url = 'http://localhost:8000/public/home';

        // Act
        subject.handleRequest(request, response, function() {
          // Assert
          expect(response.headers['set-cookie']).to.not.be.ok();
          done();
        });
      });
    });

    describe('when the request is for a protected URI', function() {
      describe('and the request has no SMSESSION cookie', function() {
        it('redirects the user to the Not Authenticated URI', function(done) {
          // Arrange
          request.url = 'http://localhost:8000/protected/home';

          // Act
          subject.handleRequest(request, response, function() {
            // Assert
            expect(response.statusCode).to.be(302);
            expect(response.headers['Location']).to.be('http://localhost:8000/system/error/notauthenticated');
            done();
          });
        });
      });

      describe('and the request has an SMSESSION cookie that does not exist', function() {
        it('redirects the user to the Not Authenticated URI', function(done) {
          // Arrange
          request.url = 'http://localhost:8000/protected/home';
          request.headers['cookie'] = 'SMSESSION=abc';

          // Act
          subject.handleRequest(request, response, function() {
            // Assert
            expect(response.statusCode).to.be(302);
            expect(response.headers['Location']).to.be('http://localhost:8000/system/error/notauthenticated');
            done();
          });
        });
      });

      describe('and the request has an SMSESSION cookie related to an expired session', function() {
        it('redirects the user to the Not Authenticated URI', function(done) {
          // Arrange
          request.url = 'http://localhost:8000/protected/home';
          request.headers['cookie'] = 'SMSESSION=xyz';
          var now = new Date();
          var sessionExpiry = new Date(now.getTime() - 30 * 60000);
          subject.sessions = {
            'xyz' : {
              'name' : 'bob',
              'session_expires' : sessionExpiry.toJSON()
            }
          };
          
          // Act
          subject.handleRequest(request, response, function() {
            // Assert
            expect(response.statusCode).to.be(302);
            expect(response.headers['Location']).to.be('http://localhost:8000/system/error/notauthenticated');
            done();
          });
        });
      });

      describe('and the request has an SMSESSION cookie related to a valid session', function() {
        beforeEach(function() {
          // Arrange
          request.url = 'http://localhost:8000/protected/home';
          request.headers['cookie'] = 'SMSESSION=xyz';
          var now = new Date();
          var sessionExpiry = new Date(now.getTime() - 10 * 60000);
          subject.sessions = {
            'xyz' : {
              'name' : 'bob',
              'session_expires' : sessionExpiry.toJSON()
            }
          };
          subject.config.users = {
            'bob' : {
              'auth_headers' : {
                'header1' : 'auth1',
                'header2' : 'auth2',
                'header3' : 'auth3'
              }
            }
          }
        });

        it('resets the expiration of the session', function(done) {
          // Arrange
          var now = new Date();
          var expected_expiry = new Date(now.getTime() + subject.config.siteminder.session_expiry_minutes * 60000);

          // Act
          subject.handleRequest(request, response, function() {
            var session_expired_date = new Date(subject.sessions['xyz'].session_expires);

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

        it('adds identity headers to the forwarded request', function(done) {
          // Act
          subject.handleRequest(request, response, function() {
            // Assert
            expect(response.headers).to.have.keys(['header1', 'header2', 'header3']);
            expect(response.headers['header1']).to.equal('auth1');
            expect(response.headers['header2']).to.equal('auth2');
            expect(response.headers['header3']).to.equal('auth3');
            done();
          });
        });

        it('forwards the request to the proxy', function(done) {
          // Act
          var forward_to_proxy = subject.handleRequest(request, response, function(proxied) {
            // Assert
            expect(proxied).to.be.ok();
            expect(response['statusCode']).to.be(undefined);
            done();
          });
        });

        it('Sets the SMSESSION cookie to the session ID, domain being proxied and sets HttpOnly to true', function(done) {
          // Act
          subject.handleRequest(request, response, function() {
            var cookie_jar = new Cookies(request, response);
            var session_cookie = cookie_jar.get('SMSESSION');

            // Assert
            expect(session_cookie).to.equal('xyz');
            done();
          });
        });
      });
    });

    describe('when the logoff URI is requested', function() {
      it('adds an SMSESSION cookie with a value of LOGGEDOFF to the response', function(done) {
        // Arrange
        request.url = 'http://localhost:8000/system/logout';

        // Act
        subject.handleRequest(request, response, function() {
          var cookies = response.headers['set-cookie'];

          // Assert
          expect(cookies).to.be.ok();
          expect(cookies).to.not.be.empty();
          expect(cookies[0]).to.contain('SMSESSION=LOGGEDOFF');
          done();
        });
      });

      it('removes the existing session corresponding to the SMSESSION cookie value', function(done) {
        // Arrange
        request.url = 'http://localhost:8000/system/logout';
        subject.sessions = {'session1':{}, 'session2':{}, 'session3':{}};
        request.headers = {'cookie':'SMSESSION=session2'};

        // Act
        subject.handleRequest(request, response, function() {
          // Assert
          expect(subject.sessions).to.not.have.key('session2');
          done();
        });
      });
    });

    describe('when the request is a POST to the logon URI', function() {
      it('calls handleLogonRequest() once', function(done) {
        // Arrange
        var times_called = 0;
        var params = [];
        subject.handleLogonRequest = function(post_data, done) {
          times_called++;
          params.push({'post_data':post_data});
        };
        request.url = subject.config.target_site.root + subject.config.target_site.urls.logon;
        request.method = 'POST';
        request.on = function(event, callback) {
          callback('');
        };

        // Act
        subject.handleRequest(request, response, function() {
          // Assert
          expect(times_called).to.equal(1);
          done();
        });
      });
    })

    describe('when the request is a GET for the login URI', function() {
      it('returns a 400 response');
    })
  });

  describe('#handleLogonRequest', function() {
    describe('when the credentials are valid', function() {
      var post_data;

      beforeEach(function() {
        request.url = subject.config.target_site.root + subject.config.target_site.urls.logon;
        request.method = 'POST';
        post_data = {
          'USERNAME':'bob',
          'PASSWORD':'test1234',
          'TARGET':'https://localhost:8000/protected/home'
        };
      });

      var findSession = function(sessions) {
        for (var session_id in subject.sessions) {
          if (subject.sessions[session_id].name === 'bob') {
            var found_session = subject.sessions[session_id];
            found_session['session_id'] = session_id;
            return found_session;
          }
        }
      };

      it('destroys any existing session for the user', function(done) {
        // Arrange
        var now = new Date();
        var session_expiry = new Date(now.getTime() - 30 * 60000);
        subject.sessions = {
          'xyz' : {
            'name' : 'bob',
            'session_expires' : session_expiry.toJSON()
          },
          'abc' : {
            'name' : 'val',
            'session_expires' : session_expiry.toJSON()
          }
        };

        // Act
        subject.handleLogonRequest(post_data, function() {
          // Assert
          expect(subject.sessions).to.not.have.key('xyz');
          done();
        });
      });

      it('creates a new session for the user', function(done) {
        // Arrange
        subject.sessions = {};

        // Act
        subject.handleLogonRequest(post_data, function() {
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
        subject.handleLogonRequest(post_data, function() {
          expect(findSession().session_expires).to.equal(session_expiry.toJSON());
          done();
        });
      });

      it('creates a new session with a 16 byte hexadecimal string session_id value', function(done) {
        // Arrange
        subject.sessions = {};
        var now = new Date();
        var session_expiry = new Date(now.getTime() + subject.config.siteminder.session_expiry_minutes * 60000);

        // Act
        subject.handleLogonRequest(post_data, function() {
          expect(findSession().session_id).to.match(/^([0-9a-fA-F]{2}){16}$/);
          done();
        });
      });

      it('responds with a redirect to the TARGET URI');
    });

    describe('when the USER is not valid', function() {
      it('responds with a redirect to the bad login URI');
    });

    describe('when the PASSWORD is not valid', function() {
      it('responds with a redirect to the bad password URI');
      it('increments the number of login attempts associated with the user');
    });

    describe('when the number of login attempts has been exceeded', function() {
      it('responds with a redirect to the account locked URI');
    });
  });

  describe('#extractPostDataFromRequest', function() {
    it('reads data from the request asynchronously');
    it('limits the amount of data read to 1024 bytes');
    it('reads all of the first 1024 bytes of data');
  })
});