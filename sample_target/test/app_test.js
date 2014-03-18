var expect = require('expect.js');
var request = require('request');

describe('SampleTarget', function() {
  var base_url = 'http://localhost:8000';
  var logon_url = base_url + '/public/siteminderagent/login.fcc';
  var protected_url = base_url + '/protected';
  var logoff_url = base_url + '/system/logout';
  var options = {};

  beforeEach(function() {
    options.followAllRedirects = true;
    options.maxRedirects = 3;
    options.jar = true;
    options.form = {};
  });

  describe('Login', function() {
    beforeEach(function() {
      options.url = logon_url;
      options.form.TARGET = protected_url;
    });

    describe('with valid credentials', function() {
      beforeEach(function() {
        options.form.USERNAME = 'bob';
        options.form.PASSWORD = 'test1234';
      });

      it('is redirected to the target URL', function(done) {
        request.post(options, function(err, res, body) {
          expect(res.statusCode).to.equal(200);
          expect(res.request.uri.href).to.equal(protected_url);
          done();
        });
      });
    });

    describe('with a bad username', function() {
      beforeEach(function() {
        options.form.USERNAME = 'bob1';
        options.form.PASSWORD = 'test1234';
      });

      it('is redirected to the bad login page', function(done) {
        request.post(options, function(err, res, body) {
          expect(res.statusCode).to.equal(200);
          expect(res.request.uri.href).to.equal(base_url + '/system/error/badlogin');
          done();
        });
      });
    });

    describe('with a bad password', function() {
      beforeEach(function() {
        options.form.USERNAME = 'bob';
        options.form.PASSWORD = 'test12341212';
      });

      it('is redirected to the bad login page', function(done) {
        request.post(options, function(err, res, body) {
          expect(res.statusCode).to.equal(200);
          expect(res.request.uri.href).to.equal(base_url + '/system/error/badpassword');
          done();
        });
      });
    });

    describe('with bad credentials three times', function() {
      beforeEach(function() {
        options.form.USERNAME = 'bob';
        options.form.PASSWORD = 'test12341212';
      });

      it('is redirected to the account locked page', function(done) {
        var count = 0;

        var callback = function(err, res, body) {
          count++;

          if (count > 2) {
            expect(res.statusCode).to.equal(200);
            expect(res.request.uri.href).to.equal(base_url + '/system/error/accountlocked');
            return done();
          }

          request.post(options, callback);
        };

        request.post(options, callback);
      });
    });
  });
});