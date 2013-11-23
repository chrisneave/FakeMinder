var expect = require('expect.js')
    Model = require('../lib/model.js');

describe('User', function() {
  describe('#ctor', function() {
    it('has a name', function() {
      // Arrange
      var subject;
      var expected = 'bob';

      // Act
      subject = new Model.User({'name': expected});

      // Assert
      expect(subject.name).to.equal(expected);
    });

    it('has a password', function() {
      // Arrange
      var subject;
      var expected = 'test1234';

      // Act
      subject = new Model.User({'password': expected});

      // Assert
      expect(subject.password).to.equal(expected);
    });

    it('has a list of auth_header key/pairs', function() {
      // Arrange
      var subject;
      var expected = {'header_1':'key_c', 'header_2':'key_b', 'header_3':'key_a'};

      // Act
      subject = new Model.User({'auth_headers': expected});

      // Assert
      expect(subject.auth_headers).to.equal(expected);
    });

    it('defaults auth_header to an empty object if not specified', function() {
      // Arrange
      var subject;
      var expected = {};

      // Act
      subject = new Model.User();

      // Assert
      expect(subject.auth_headers).to.eql(expected);
    });

    it('has a count of login attempts that defaults to zero', function() {
      // Arrange
      var subject;
      var expected = 0;

      // Act
      subject = new Model.User();

      // Assert
      expect(subject.login_attempts).to.eql(expected);
    });

    it('has a flag to indicate whether the user\'s account is locked', function() {
      // Arrange
      var subject;
      var expected = false;

      // Act
      subject = new Model.User();

      // Assert
      expect(subject.locked).to.eql(expected);
    })
  });
});

describe('Session', function() {
  describe('#ctor', function() {
    it('has a session_id', function() {
      // Arrange
      var subject;
      var expected = 'session_123';

      // Act
      subject = new Model.Session({'session_id': expected});

      // Assert
      expect(subject.session_id).to.equal(expected);
    });

    it('generates a random session_id if not specified', function() {
      // Arrange
      var subject;

      // Act
      subject = new Model.Session();

      // Assert
      expect(subject.session_id).to.be.ok();
    });

    it('has a user', function() {
      // Arrange
      var subject,
          expected = new Model.User('bob', 'test1234', {});

      // Act
      subject = new Model.Session({'session_id': 'session_123', 'user': expected});

      // Assert
      expect(subject.user).to.equal(expected);
    });

    it('has an expiration', function() {
      // Arrange
      var subject,
          expected = new Date();

      // Act
      subject = new Model.Session({'expiration': expected});

      // Assert
      expect(subject.expiration).to.equal(expected);
    });
  });

  describe('#resetExpiration', function() {
    it('resets the expiration property to the current time + the specified session timeout in minutes', function() {
      // Arrange
      var now = new Date();
      var expected = new Date(now.getTime() + 20 * 60000);
      var subject = new Model.Session({'now': now});

      // Act
      subject.resetExpiration(20);

      // Assert
      expect(new Date(subject.expiration)).to.eql(expected);
    });
  });

  describe('#hasExpired', function() {
    it('returns \'true\' when the expiration property is less than the current date/time', function() {
      // Arrange
      var actual;
      var expected = true;
      var now = new Date();
      var session_expiry = new Date(now.getTime() - 1 * 60000);
      var subject = new Model.Session();
      subject.expiration = session_expiry.toJSON();

      // Act
      actual = subject.hasExpired();

      // Assert
      expect(actual).to.equal(expected);
    });

    it('returns \'false\' when the expiration property is greater than the current date/time', function() {
      // Arrange
      var actual;
      var expected = false;
      var now = new Date();
      var session_expiry = new Date(now.getTime() + 1 * 60000);
      var subject = new Model.Session();
      subject.expiration = session_expiry.toJSON();

      // Act
      actual = subject.hasExpired();

      // Assert
      expect(actual).to.equal(expected);
    });

    it('returns \'false\' when the expiration property equals the current date/time', function() {
      // Arrange
      var actual;
      var expected = false;
      var now = new Date();
      var subject = new Model.Session();
      subject.expiration = now.toJSON();

      // Act
      actual = subject.hasExpired();

      // Assert
      expect(actual).to.equal(expected);
    });
  });
});

describe('FormCred', function() {
  describe('#ctor', function() {
    it('has a formcred_id', function() {
      // Arrange
      var subject;
      var expected = 'formcred_123';

      // Act
      subject = new Model.FormCred({'formcred_id': expected});

      // Assert
      expect(subject.formcred_id).to.equal(expected);
    });

    it('generates a random formcred_id if not specified', function() {
      // Arrange
      var subject;

      // Act
      subject = new Model.FormCred();

      // Assert
      expect(subject.formcred_id).to.be.ok();
    });

    it('has a user', function() {
      // Arrange
      var subject,
          expected = new Model.User('bob', 'test1234', {});

      // Act
      subject = new Model.FormCred({'user': expected});

      // Assert
      expect(subject.user).to.equal(expected);
    });

    it('has a status', function() {
      // Arrange
      var subject,
          expected = 'GOOD_CREDS';

      // Act
      subject = new Model.FormCred({'status': expected});

      // Assert
      expect(subject.status).to.equal(expected);
    });
  });
});