var expect = require('expect.js');

describe('PathFilter', function() {
  var subject = require('../lib/pathfilter'),
      url_config;

  beforeEach(function() {
    url_config = {};
    url_config.protected_by_default = true;
  });

  describe('#getPathFilter', function() {
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
      url_config.path_filters = [{ url: '/abc/123', protected: false }];

      // Act
      var result = subject.getPathFilter(url_config, '/abc/123');

      // Assert
      expect(result).to.eql(url_config.path_filters[0]);
    });

    it('can fail to match a URL exactly', function() {
      // Arrange
      url_config.path_filters = [{ url: '/abc/123/xyz', protected: false }];

      // Act
      var result = subject.getPathFilter(url_config, '/abc/123');

      // Assert
      expect(result).to.eql({ url: '{default}', protected: true});
    });

    it('matches the first path in the order it is configured', function() {
      // Arrange
      url_config.path_filters = [];
      url_config.path_filters.push({ url: '/abc/123', protected: false });
      url_config.path_filters.push({ url: '/abc/123', protected: true });

      // Act
      var result = subject.getPathFilter(url_config, '/abc/123');

      // Assert
      expect(result).to.eql(url_config.path_filters[0]);
    });

    it('handles paths with trailing slashes', function() {
      // Arrange
      url_config.path_filters = [{ url: '/abc/123/', protected: false }];

      // Act
      var result = subject.getPathFilter(url_config, '/abc/123');

      // Assert
      expect(result).to.eql(url_config.path_filters[0]);
    });

    describe('wildcard support', function() {
      it('matches against a leading wildcard', function() {
        // Arrange
        url_config.path_filters = [{ url: '*/xyz', protected: false }];

        // Act
        var result = subject.getPathFilter(url_config, '/abc/123/xyz');

        // Assert
        expect(result).to.eql(url_config.path_filters[0]);
      });

      it('matches against a trailing wildcard', function() {
        // Arrange
        url_config.path_filters = [{ url: '/abc/*', protected: false }];

        // Act
        var result = subject.getPathFilter(url_config, '/abc/123');

        // Assert
        expect(result).to.eql(url_config.path_filters[0]);
      });

      it('matches against a combined wildcard', function() {
        // Arrange
        url_config.path_filters = [{ url: '*/123/*', protected: false }];

        // Act
        var result = subject.getPathFilter(url_config, '/abc/123/xyz');

        // Assert
        expect(result).to.eql(url_config.path_filters[0]);
      });
    });

    describe('path component filters', function() {
      it('skips a path component when matching a URL', function() {
        // Arrange
        url_config.path_filters = [{ url: '{1}/123/xyz', protected: false }];

        // Act
        var result = subject.getPathFilter(url_config, '/abc/123/xyz');

        // Assert
        expect(result).to.eql(url_config.path_filters[0]);
      });

      it('skips multiple path components if specified in the filter', function() {
        // Arrange
        url_config.path_filters = [{ url: '{5}/123/xyz', protected: false }];

        // Act
        var result = subject.getPathFilter(url_config, '/abc/1/2/dd/43d%20/123/xyz');

        // Assert
        expect(result).to.eql(url_config.path_filters[0]);
      });

      it('can use path component filters and wildcards together', function() {
        // Arrange
        url_config.path_filters = [{ url: '{2}*/123/*', protected: false }];

        // Act
        var result = subject.getPathFilter(url_config, '/abc/1/2/dd/43d%20/123/xyz');

        // Assert
        expect(result).to.eql(url_config.path_filters[0]);
      });
    });
  });

  describe('resolve', function() {
    it('skips a path component when matching a URL', function() {
      // Arrange
      var url = 'http://localhost:8000/one/foo/bar';
      var path_filter = '{1}/fizz/buzz';
      var expected = 'http://localhost:8000/one/fizz/buzz';

      // Act
      var result = subject.resolve(url, path_filter);

      // Assert
      expect(result).to.equal(expected);
    });

    it('ignores query string parameters', function() {
      // Arrange
      var url = 'http://localhost:8000/one/foo/bar?one=two';
      var path_filter = '{1}/fizz/buzz';
      var expected = 'http://localhost:8000/one/fizz/buzz?one=two';

      // Act
      var result = subject.resolve(url, path_filter);

      // Assert
      expect(result).to.equal(expected);
    });

    it('includes multiple components', function() {
      // Arrange
      var url = 'http://localhost:8000/one/two/three/foo/bar?one=two';
      var path_filter = '{3}/fizz/buzz';
      var expected = 'http://localhost:8000/one/two/three/fizz/buzz?one=two';

      // Act
      var result = subject.resolve(url, path_filter);

      // Assert
      expect(result).to.equal(expected);
    });

    it('includes all components when the path filter specifies more components than are in the URL', function() {
      // Arrange
      var url = 'http://localhost:8000/bar?one=two';
      var path_filter = '{3}/fizz/buzz';
      var expected = 'http://localhost:8000/bar/fizz/buzz?one=two';

      // Act
      var result = subject.resolve(url, path_filter);

      // Assert
      expect(result).to.equal(expected);
    });

    it('throws an error if the path filter is invalid', function() {
      // Arrange
      var url = 'http://localhost:8000/bar?one=two';
      var path_filter = '{-3}/fizz/buzz';

      // Act
      // Assert
      expect(function() { subject.resolve(url, path_filter); }).to.throwError();
    });
  });
});
