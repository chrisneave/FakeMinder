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
      foo = function(err, done) {
        i++;
        result.push(i);
        done();
      }
      subject['queue'] = [foo, foo, foo];

      // Act
      subject.execute();

      // Assert
      expect(result).to.eql([1, 2, 3]);
    });

    it('passes a callback function for handling errors as the first parameter of each function call', function(done) {
      // Arrange
      var err_func;
      foo = function(err) {
        err_func = err;
        err_func();
        done();
      };
      subject['queue'] = [foo];

      // Act
      subject.execute();

      // Assert
      expect(err_func).to.be.ok();
    });

    it('passes a callback function for handling completion as the second parameter of each function call', function(done) {
      // Arrange
      var result_func;
      foo = function(err, result) {
        result_func = result;
        result_func();
        done();
      };
      subject['queue'] = [foo];

      // Act
      subject.execute();

      // Assert
      expect(result_func).to.be.ok();
    });

    it('passes data from one function to the next in the chain', function(done) {
      // Arrange
      foo = function(err, result, data) {
        data = data ? data : 0;
        data++;
        if (data === 3) {
          done();
        } else {
          result(data);
        }
      };
      subject['queue'] = [foo, foo, foo];

      // Act
      subject.execute();
    });
  });
});