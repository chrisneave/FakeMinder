
exports.index = function(req, res) {
  res.render('index', { title: 'Sample Target App' });
};

exports.protected = function(req, res) {
  res.render('protected', { title: 'Protected', headers: req.headers });
};

exports.login = function(req, res) {
  res.render('login', { title: 'Login' });
};

exports.logoff = function(req, res) {
  res.render('message', { title: 'Logoff', message: 'Your are now logged off. Have a nice day!'});
};

exports.not_authenticated = function(req, res) {
  res.render('message', { title: 'Not authenticated', message: 'Your are not authenticated. Please login before accessing this resource.'});
};
