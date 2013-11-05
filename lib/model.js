
module.exports.User = function(name, password, auth_headers) {
  return {
    'name': name,
    'password': password,
    'auth_headers': auth_headers
  };
};

module.exports.Session = function(session_id, user, expiration) {
  return {
    'session_id': session_id,
    'user': user,
    'expiration': expiration
  };
};

module.exports.FormCred = function(formcred_id, user, status) {
  return {
    'formcred_id': formcred_id,
    'user': user,
    'status': status
  };
};
