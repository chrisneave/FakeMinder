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

var url = require('url'),
    fakeminder_config;

exports.init = function(config) {
  fakeminder_config = config;
};

exports.index = function(req, res) {
  res.render('index', {
    title: 'Sample Target App',
    logoff_url: '/system/logout',
    protected_url: '/protected'
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
    target: '/protected',
    sm_login: fakeminder_config.siteminder().login_fcc
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
