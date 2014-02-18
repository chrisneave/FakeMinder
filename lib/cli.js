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

module.exports.create = function(inquirer, args, writeFile, done) {
  var questions = [
    {
      name: 'config_name',
      type: 'input',
      message: 'Enter a name for the new configuration file',
      default: 'new_config.json'
    },
    {
      name: 'proxy_url',
      type: 'input',
      message: 'Enter the base URL for the proxy',
      default: 'http://localhost:8000'
    },
    {
      name: 'proxy_logon_url',
      type: 'input',
      message: 'Enter the relative URL for the FakeMinder login.fcc',
      default: '/public/siteminderagent/login.fcc'
    },
    {
      name: 'siteminder_session_expiry_minutes',
      type: 'input',
      message: 'Enter the timeout to use for FakeMinder sessions in minutes',
      default: 20
    },
    {
      name: 'siteminder_max_login_attempts',
      type: 'input',
      message: 'Enter the maximum number of attempts each user has to login before their account is locked',
      default: 3
    },
    {
      name: 'siteminder_smagentname',
      type: 'input',
      message: 'Enter the value of the SMAGENTNAME post parameter'
    },
    {
      name: 'target_site_url',
      type: 'input',
      message: 'Enter the base URL for the application you want protected',
      default: 'http://localhost:4567'
    },
    {
      name: 'target_site_logoff',
      type: 'input',
      message: 'Enter the relative URL for logging off a user',
      default: '/system/logout'
    },
    {
      name: 'target_site_not_authenticated',
      type: 'input',
      message: 'Enter the relative URL for redirecting unauthenticated users',
      default: '/system/error/notauthenticated'
    },
    {
      name: 'target_site_bad_login',
      type: 'input',
      message: 'Enter the relative URL for redirecting users that have entered an invalid username',
      default: '/system/error/badlogin'
    },
    {
      name: 'target_site_bad_password',
      type: 'input',
      message: 'Enter the relative URL for redirecting users that have entered an invalid password',
      default: '/system/error/badpassword'
    },
    {
      name: 'target_site_account_locked',
      type: 'input',
      message: 'Enter the relative URL for redirecting users who\'s account is locked',
      default: '/system/error/accountlocked'
    },
    {
      name: 'target_site_protected',
      type: 'input',
      message: 'Enter the relative URL for the protected resources',
      default: '/protected'
    }
  ];

  inquirer.prompt(questions, function(answers) {
    var new_config = {
      proxy: {
        url: answers.proxy_url,
        set_x_proxied_by: true,
        pathnames: {
          logon: answers.proxy_logon_url
        }
      },
      siteminder: {
        sm_cookie: 'SMSESSION',
        formcred_cookie: 'FORMCRED',
        userid_field: 'USERNAME',
        password_field: 'PASSWORD',
        target_field: 'TARGET',
        session_expiry_minutes: answers.siteminder_session_expiry_minutes,
        max_login_attempts: answers.siteminder_max_login_attempts,
        smagentname: answers.siteminder_smagentname
      },
      target_site: {
        url: answers.target_site_url,
        pathnames: {
          logoff: answers.target_site_logoff,
          not_authenticated: answers.target_site_not_authenticated,
          bad_login: answers.target_site_bad_login,
          bad_password: answers.target_site_bad_password,
          account_locked: answers.target_site_account_locked,
          protected: [
            { url: answers.target_site_protected, protected: true }
          ]
        }
      },
      users: [
        {
          name: 'bob',
          password: 'test1234',
          auth_headers: {
            'client-id': 'cid123',
            'user-id': 'uid456'
          },
          login_attempts: 0,
          locked: false
        }
      ]
    };

    writeFile(answers.config_name, JSON.stringify(new_config, null, '\t'), function(err) {
      done(answers.config_name, err);
    });
  });
};
