var crypto = require('crypto');

module.exports.User = function(options) {
  if (!options) {
    options = {};
  }

  return {
    'name': options.name,
    'password': options.password,
    'auth_headers': options.auth_headers || {},
    'login_attempts': 0,
    'locked': false
  };
};

module.exports.Session = function(options) {
  if (!options) {
    options = {};
  }

  return {
    'session_id': options.session_id || crypto.randomBytes(16).toString('hex'),
    'user': options.user,
    'expiration': options.expiration,
    'resetExpiration': function(session_timeout) {
      var new_expiration = options.now || new Date();
      new_expiration = new Date(new_expiration.getTime() + 20 * 60000);
      this.expiration = new_expiration.toJSON();
    },
    'hasExpired': function() {
      var now = options.now || new Date(),
          expiration_date = new Date(this.expiration);

      return (+expiration_date < +now);
    }
  };
};

module.exports.FormCred = function(options) {
  if (!options) {
    options = {};
  }

  return {
    'formcred_id': options.formcred_id || crypto.randomBytes(16).toString('base64'),
    'user': options.user,
    'status': options.status
  };
};

module.exports.FormCredStatus = {
  'good_login': 'good_login',
  'bad_login': 'bad_login',
  'bad_password': 'bad_password'
};