var expect = require('expect.js'),
    sinon = require('sinon'),
    util = require(__dirname + '/../lib/util');

describe('Util', function() {
  describe('#redirectUrlFromRequest', function() {
    it('builds an absolute request URL from the given HTTP request and URL path & query', function() {
      // Arrange
      var req = {
        headers: { host: 'example.com:8000' },
        connection: {}
      };
      var path = '/foo/bar?baz=bar#title';
      var expected = 'http://example.com:8000/foo/bar?baz=bar#title';
      var result;

      // Act
      result = util.redirectUrlFromRequest(req, path);

      // Assert
      expect(result).to.equal(expected);
    });

    it('can handle an empty path', function() {
      // Arrange
      var req = {
        headers: { host: 'example.com:8000' },
        connection: {}
      };
      var path = '';
      var expected = 'http://example.com:8000/';
      var result;

      // Act
      result = util.redirectUrlFromRequest(req, path);

      // Assert
      expect(result).to.equal(expected);
    });

    it('specifies HTTPS for TLS connections', function() {
      // Arrange
      var req = {
        headers: { host: 'example.com:8000' },
        connection: { encrypted: true }
      };
      var path = '';
      var expected = 'https://example.com:8000/';
      var result;

      // Act
      result = util.redirectUrlFromRequest(req, path);

      // Assert
      expect(result).to.equal(expected);
    });
  });
});