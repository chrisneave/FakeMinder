/*
 * The MIT License (MIT)
 * 
 * Copyright (c) 2013 Chris Neave
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

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