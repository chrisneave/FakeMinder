
exports.index = function(req, res) {
  res.render('index', {
    title: 'Sample Target App',
    logoff_url: fakeminder_config.target_site.urls.logoff,
    protected_url: fakeminder_config.target_site.urls.protected
  });
};

exports.protected = function(req, res) {
  res.render('protected', { title: 'Protected', headers: req.headers });
};

exports.logon = function(req, res) {
  res.render('logon', { title: 'Logon' });
};

exports.logoff = function(req, res) {
  res.render('message', { title: 'Logoff', message: 'Your are now logged off. Have a nice day!'});
};

exports.not_authenticated = function(req, res) {
  res.render('message', { title: 'Not authenticated', message: 'Your are not authenticated. Please login before accessing this resource.'});
};
