var expect = require('expect.js');

describe('PathFilter', function() {
  describe('#getPathFilter', function() {
    var subject = require('../lib/pathfilter'),
        url_config;

    beforeEach(function() {
      url_config = {};
      url_config.protected_by_default = true;
    });

    describe('protected_by_default is true', function() {
      beforeEach(function() {
        url_config.protected_by_default = true;
      });

      it('uses the default value is there are no rules', function() {
        // Arrange
        var url = '/abc/123',
            result;

        // Act
        result = subject.getPathFilter(url_config, url);

        // Assert
        expect(result).to.eql({ url: '{default}', protected: true});
      });
    });

    describe('protected_by_default is false', function() {
      beforeEach(function() {
        url_config.protected_by_default = false;
      });

      it('uses the default value is there are no rules', function() {
        // Arrange
        var url = '/abc/123',
            result;

        // Act
        result = subject.getPathFilter(url_config, url);

        // Assert
        expect(result).to.eql({ url: '{default}', protected: false});
      });
    });

    it('can match a URL exactly', function() {
      // Arrange
      url_config.paths = [{ url: '/abc/123', protected: false }];

      // Act
      var result = subject.getPathFilter(url_config, '/abc/123');

      // Assert
      expect(result).to.eql(url_config.paths[0]);
    });

    it('can fail to match a URL exactly', function() {
      // Arrange
      url_config.paths = [{ url: '/abc/123/xyz', protected: false }];

      // Act
      var result = subject.getPathFilter(url_config, '/abc/123');

      // Assert
      expect(result).to.eql({ url: '{default}', protected: true});
    });

    it('matches the first path in the order it is configured', function() {
      // Arrange
      url_config.paths = [];
      url_config.paths.push({ url: '/abc/123', protected: false });
      url_config.paths.push({ url: '/abc/123', protected: true });

      // Act
      var result = subject.getPathFilter(url_config, '/abc/123');

      // Assert
      expect(result).to.eql(url_config.paths[0]);
    });

    it('handles paths with trailing slashes', function() {
      // Arrange
      url_config.paths = [{ url: '/abc/123/', protected: false }];

      // Act
      var result = subject.getPathFilter(url_config, '/abc/123');

      // Assert
      expect(result).to.eql(url_config.paths[0]);
    });

    describe('wildcard support', function() {
      it('matches against a leading wildcard', function() {
        // Arrange
        url_config.paths = [{ url: '*/xyz', protected: false }];

        // Act
        var result = subject.getPathFilter(url_config, '/abc/123/xyz');

        // Assert
        expect(result).to.eql(url_config.paths[0]);
      });

      it('matches against a trailing wildcard', function() {
        // Arrange
        url_config.paths = [{ url: '/abc/*', protected: false }];

        // Act
        var result = subject.getPathFilter(url_config, '/abc/123');

        // Assert
        expect(result).to.eql(url_config.paths[0]);
      });

      it('matches against a combined wildcard', function() {
        // Arrange
        url_config.paths = [{ url: '*/123/*', protected: false }];

        // Act
        var result = subject.getPathFilter(url_config, '/abc/123/xyz');

        // Assert
        expect(result).to.eql(url_config.paths[0]);
      });
    });

    describe('path component filters', function() {
      it('skips a path component when matching a URL', function() {
        // Arrange
        url_config.paths = [{ url: '{1}/123/xyz', protected: false }];

        // Act
        var result = subject.getPathFilter(url_config, '/abc/123/xyz');

        // Assert
        expect(result).to.eql(url_config.paths[0]);
      });

      it('skips multiple path components if specified in the filter', function() {
        // Arrange
        url_config.paths = [{ url: '{5}/123/xyz', protected: false }];

        // Act
        var result = subject.getPathFilter(url_config, '/abc/1/2/dd/43d%20/123/xyz');

        // Assert
        expect(result).to.eql(url_config.paths[0]);
      });

      it('can use path component filters and wildcards together', function() {
        // Arrange
        url_config.paths = [{ url: '{2}*/123/*', protected: false }];

        // Act
        var result = subject.getPathFilter(url_config, '/abc/1/2/dd/43d%20/123/xyz');

        // Assert
        expect(result).to.eql(url_config.paths[0]);
      });
    });
  });
});
