var url = require('url');

exports.index = function(req, res) {
  res.render('index', {
    title: 'Sample Target App',
    logoff_url: fakeminder_config.target_site.urls.logoff,
    protected_url: fakeminder_config.target_site.urls.protected
  });
};

exports.protected = function(req, res) {
  res.render('protected', {
    title: 'Protected', headers: req.headers
  });
};

exports.logon = function(req, res) {
  res.render('logon', {
    title: 'Login',
    target: url.resolve(fakeminder_config.target_site.root, fakeminder_config.target_site.urls.protected),
    sm_login: fakeminder_config.target_site.urls.logon
  });
};

exports.logoff = function(req, res) {
  res.render('message', {
    title: 'Logoff',
    message: 'Your are now logged off. Have a nice day!'
  });
};

exports.not_authenticated = function(req, res) {
  res.render('message', {
    title: 'Not authenticated',
    message: 'Your are not authenticated. Please login before accessing this resource.'
  });
};

exports.bad_login = function(req, res) {
  res.render('message', {
    title: 'Bad Login',
    message: ''
  });
};

exports.bad_password = function(req, res) {
  res.render('message', {
    title: 'Bad Password',
    message: ''
  });
};

exports.account_locked = function(req, res) {
  res.render('message', {
    title: 'Account Locked',
    message: 'Your account has been locked.'
  });
};
