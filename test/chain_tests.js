var assert = require('assert');
var expect = require('expect.js');
var Chain = require('../lib/chain.js');

describe('Chain', function() {
  var subject,
      foo;

  beforeEach(function() {
    subject = new Chain();
    foo = function() {};
  });

  describe('#then', function() {
    it('remembers the function in the call queue', function() {
      // Act
      subject.then(foo);

      // Assert
      expect(subject['queue']).to.contain(foo);
    });

    it('returns itself to allow chained calls', function() {
      // Act
      var subject2 = subject.then(foo);

      // Assert
      expect(subject2).to.equal(subject);
    });

    it('adds additional functions to the end of the call queue', function() {
      // Arrange
      var foo1 = function() {};
      var foo2 = function() {};
      var foo3 = function() {};

      // Act
      subject.then(foo1);
      subject.then(foo2);
      subject.then(foo3);

      // Assert
      expect(subject['queue']).to.eql([foo1, foo2, foo3]);
    });
  });

  describe('#execute', function() {
    it('calls each function in the queue in sequence', function() {
      // Arrange
      var i = 0;
      var result = [];
      foo = function() {
        i++;
        result.push(i);
      }
      subject['queue'] = [foo, foo, foo];

      // Act
      subject.execute();

      // Assert
      expect(result).to.eql([1, 2, 3]);
    });
  });
});