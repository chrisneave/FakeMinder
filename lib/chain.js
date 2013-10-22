
function Chain() {
  this.queue = [];
}

Chain.prototype.then = function(func) {
  this.queue.push(func);
  return this;
};

Chain.prototype.execute = function() {
  for (var i = 0; i < this.queue.length; i++) {
    var func = this.queue[i];
    func();
  }
};

module.exports = Chain;
