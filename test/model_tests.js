var expect = require('expect.js')
    Model = require('../lib/model.js');

describe('User', function() {
  describe('#ctor', function() {
    it('has a name', function() {
      // Arrange
      var subject;
      var expected = 'bob';

      // Act
      subject = new Model.User(expected);

      // Assert
      expect(subject.name).to.equal(expected);
    });

    it('has a password', function() {
      // Arrange
      var subject;
      var expected = 'test1234';

      // Act
      subject = new Model.User('', expected);

      // Assert
      expect(subject.password).to.equal(expected);
    });

    it('has a list of auth_header key/pairs', function() {
      // Arrange
      var subject;
      var expected = {'header_1':'key_c', 'header_2':'key_b', 'header_3':'key_a'};

      // Act
      subject = new Model.User('', '', expected);

      // Assert
      expect(subject.auth_headers).to.equal(expected);
    });
  })
});

describe('Session', function() {
  describe('#ctor', function() {
    it('has a session_id', function() {
      // Arrange
      var subject;
      var expected = 'session_123';

      // Act
      subject = new Model.Session(expected);

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
      subject = new Model.Session('session_123', expected);

      // Assert
      expect(subject.user).to.equal(expected);
    });

    it('has an expiration', function() {
      // Arrange
      var subject,
          expected = new Date();

      // Act
      subject = new Model.Session('', {}, expected);

      // Assert
      expect(subject.expiration).to.equal(expected);
    });
  })
});

describe('FormCred', function() {
  describe('#ctor', function() {
    it('has a formcred_id', function() {
      // Arrange
      var subject;
      var expected = 'formcred_123';

      // Act
      subject = new Model.FormCred(expected);

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
      subject = new Model.FormCred('session_123', expected);

      // Assert
      expect(subject.user).to.equal(expected);
    });

    it('has a status', function() {
      // Arrange
      var subject,
          expected = 'GOOD_CREDS';

      // Act
      subject = new Model.FormCred('', {}, expected);

      // Assert
      expect(subject.status).to.equal(expected);
    });
  })
});