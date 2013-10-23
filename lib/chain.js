
function Chain() {
  var self = this;
  this.queue = [];
  this['error'] = function(err) {

  };
  this['done'] = function(data) {
    var func = self.queue.shift();
    if (func) {
      func(self['error'], self['done'], data);
    }
  };
}

Chain.prototype.then = function(func) {
  this.queue.push(func);
  return this;
};

Chain.prototype.execute = function() {
  this.done();
};

module.exports = Chain;
