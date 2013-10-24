
function Chain() {
  var self = this;
  this.queue = [];
  this['error'] = function(err) {

  };
  this['next'] = function(data) {
    var func = self.queue.shift();
    if (func) {
      func(self['error'], self['next'], data);
    }
  };
}

Chain.prototype.then = function(func) {
  this.queue.push(func);
  return this;
};

Chain.prototype.execute = function() {
  this.next();
};

module.exports = Chain;
