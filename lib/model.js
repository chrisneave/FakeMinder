var crypto = require('crypto');

module.exports.User = function(name, password, auth_headers) {
  return {
    'name': name,
    'password': password,
    'auth_headers': auth_headers || {},
    'login_attempts': 0,
    'locked': false
  };
};

module.exports.Session = function(session_id, user, expiration) {
  return {
    'session_id': session_id || crypto.randomBytes(16).toString('hex'),
    'user': user,
    'expiration': expiration,
    'resetExpiration': function(session_timeout) {
      var new_expiration = new Date();
      new_expiration = new Date(new_expiration.getTime() + 20 * 60000);
      this.expiration = new_expiration.toJSON();
    }
  };
};

module.exports.FormCred = function(formcred_id, user, status) {
  return {
    'formcred_id': formcred_id || crypto.randomBytes(16).toString('base64'),
    'user': user,
    'status': status
  };
};

module.exports.FormCredStatus = {
  'good_login': 'good_login',
  'bad_login': 'bad_login',
  'bad_password': 'bad_password'
};