var assert = require('assert');
var expect = require('expect.js');
var fs = require('fs');
var Cookies = require('cookies');
var FakeMinder = require('../lib/fakeminder.js');

describe('FakeMinder', function() {
  var subject;
  var emptySession;

  beforeEach(function() {
    subject = new FakeMinder();
    emptySession = { 'user':'' };
    subject.config['target_site'] = {
      'root':'http://localhost:8000',
      'urls':{
        'logoff':'/system/logout',
        'not_authenticated':'/system/error/notauthenticated',
        'protected':'/protected'
      }
    };
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

    // Stub out the fs.readFile function.
    /*
    var rf = fs.readFileSync;
    fs.readFileSync = function(file, encoding) {
      this.readFileSync = rf;
      if (file.indexOf('/../config.json') > 0) {
        return json;
      } else {
        return;
      }
    };
    */

    // Act
    subject = new FakeMinder();

    // Assert
    expect(subject.config).to.eql(json);
  });

  describe('#getUserForCurrentSession()', function() {
    it('finds the session that matches the current SmSession cookie.', function() {
      var existingSession = {
        'xyz' : {
          'name' :'bob'
        }
      };
      subject.sessions = existingSession;
      var req = {
        'headers': {
          'cookie':'SMSESSION=xyz'
        }
      };

      var session = subject.getUserForCurrentSession(req);

      expect(session['name']).to.equal('bob');
    });

    it('returns an empty session for an SmSession cookie that does not match an existing session.', function() {
      subject.sessions = {'xyz':''};
      var req = { 'headers':{'cookie':'SMSESSION=abc'} };

      var session = subject.getUserForCurrentSession(req);

      expect(session).to.eql(emptySession);
    });

    it('returns an empty session if an SmSession cookie does not exist.', function() {
      var req = { 'headers':{'cookie':'SMSESSION=abc'} };

      var session = subject.getUserForCurrentSession(req);

      expect(session).to.eql(emptySession);
    });

    it('returns an empty session if there are no active sessions.', function() {
      var req = { 'headers':{} };

      var session = subject.getUserForCurrentSession(req);

      expect(session).to.eql(emptySession);
    })
  });

  describe('#handleRequest()', function() {
    var request;
    var response;

    beforeEach(function() {
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
      response['end'] = function() {

      };
    });

    it('adds a "x-proxied-by" header value with the host/port value of the proxy', function() {
      // Arrange

      // Act
      subject.handleRequest(request, response);

      // Assert
      expect(response.headers).to.be.ok();
      expect(response.headers).to.have.key('x-proxied-by');
      expect(response.headers['x-proxied-by']).to.equal('localhost:8000');
    });

    describe('when the request is for a protected URI', function() {

      describe('and the request has no SMSESSION cookie', function() {
        it('redirects the user to the Not Authenticated URI', function() {
          // Arrange
          request.url = 'http://localhost:8000/protected/home';

          // Act
          subject.handleRequest(request, response);

          // Assert
          expect(response.statusCode).to.be(302);
          expect(response.headers['Location']).to.be('http://localhost:8000/system/error/notauthenticated');
        });
      });

      describe('and the request has an SMSESSION cookie that does not exist', function() {
        it('redirects the user to the Not Authenticated URI', function() {
          // Arrange
          request.url = 'http://localhost:8000/protected/home';
          request.headers['cookie'] = 'SMSESSION=abc';

          // Act
          subject.handleRequest(request, response);

          // Assert
          expect(response.statusCode).to.be(302);
          expect(response.headers['Location']).to.be('http://localhost:8000/system/error/notauthenticated');
        });
      });

      describe('and the request has an SMSESSION cookie related to an expired session', function() {
        it('redirects the user to the Not Authenticated URI', function() {
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
          subject.handleRequest(request, response);

          // Assert
          expect(response.statusCode).to.be(302);
          expect(response.headers['Location']).to.be('http://localhost:8000/system/error/notauthenticated');          
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
              'session_expires' : sessionExpiry.toJSON(),
              'auth_headers' : {
                'header1' : 'auth1',
                'header2' : 'auth2',
                'header3' : 'auth3'
              }
            }
          };
        });

        it('Resets the expiration of the session');

        it('Adds identity headers to the forwarded request', function() {
          // Act
          var forward_to_proxy = subject.handleRequest(request, response);

          // Assert
          expect(response.headers).to.have.keys(['header1', 'header2', 'header3']);
          expect(response.headers['header1']).to.equal('auth1');
          expect(response.headers['header2']).to.equal('auth2');
          expect(response.headers['header3']).to.equal('auth3');
        });

        it('forwards the request to the proxy', function() {
          // Act
          var forward_to_proxy = subject.handleRequest(request, response);

          // Assert
          expect(forward_to_proxy).to.be.ok();
          expect(response['statusCode']).to.be(undefined);
        });

        it('Sets the SMSESSION cookie to the session ID, domain being proxied and sets HttpOnly to true', function() {
          // Act
          subject.handleRequest(request, response);
          var cookie_jar = new Cookies(request, response);
          var session_cookie = cookie_jar.get('SMSESSION');

          // Assert
          expect(session_cookie).to.equal('xyz');
        });
      });
    });

    describe('when the logoff_url is requested', function() {
      it('adds an SMSESSION cookie with a value of LOGGEDOFF to the response', function() {
        // Arrange
        request.url = 'http://localhost:8000/system/logout';

        // Act
        subject.handleRequest(request, response);
        var cookies = response.headers['set-cookie'];

        // Assert
        expect(cookies).to.be.ok();
        expect(cookies).to.not.be.empty();
        expect(cookies[0]).to.contain('SMSESSION=LOGGEDOFF');
      });

      it('removes the existing session corresponding to the SMSESSION cookie value', function() {
        // Arrange
        request.url = 'http://localhost:8000/system/logout';
        subject.sessions = {'session1':{}, 'session2':{}, 'session3':{}};
        request.headers = {'cookie':'SMSESSION=session2'};

        // Act
        subject.handleRequest(request, response);

        // Assert
        expect(subject.sessions).to.not.have.key('session2');
      });
    });

    describe('when the request is a post to the login_url', function() {
      describe('when the credentials are valid', function() {
        it('adds an SMSESSION cookie with the session ID to the response');
        it('responds with a redirect to the TARGET URI');
      });

      describe('when the USER is not valid', function() {
        it('responds with a redirect to the bad login URI');
      });

      describe('when the PASSWORD is not valid', function() {
        it('responds with a redirect to the bad password URI');
      });

      describe('when the number of login attempts has been exceeded', function() {
        it('responds with a redirect to the account locked URI');
      });
    });
  })

  describe('#beginSession()', function(req, res) {
  });
});