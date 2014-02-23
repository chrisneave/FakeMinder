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
      name: 'proxy_port',
      type: 'input',
      message: 'Enter the port the proxy should listen on',
      default: 8000
    },
    {
      name: 'upstream_app_hostname',
      type: 'input',
      message: 'Enter the hostname or IP address of the upstream application',
      default: 'localhost'
    },
    {
      name: 'upstream_app_port',
      type: 'input',
      message: 'Enter the port to use to connect to the upstream application',
      default: '80'
    },
    {
      name: 'siteminder_smagentname',
      type: 'input',
      message: 'Enter the value of the SMAGENTNAME post parameter',
      default: ''
    },
    {
      name: 'logoff_path',
      type: 'input',
      message: 'Enter the relative URL hosted by the upstream application for logging off a user',
      default: '/system/logout'
    },
    {
      name: 'not_authenticated_path',
      type: 'input',
      message: 'Enter the relative URL hosted by the upstream application for redirecting unauthenticated users',
      default: '/system/error/notauthenticated'
    },
    {
      name: 'bad_login_path',
      type: 'input',
      message: 'Enter the relative URL hosted by the upstream application for redirecting users that have entered an invalid username',
      default: '/system/error/badlogin'
    },
    {
      name: 'bad_password_path',
      type: 'input',
      message: 'Enter the relative URL hosted by the upstream application for redirecting users that have entered an invalid password',
      default: '/system/error/badpassword'
    },
    {
      name: 'account_locked_path',
      type: 'input',
      message: 'Enter the relative URL hosted by the upstream application for redirecting users who\'s account is locked',
      default: '/system/error/accountlocked'
    },
    {
      name: 'protected_path',
      type: 'input',
      message: 'Enter the relative URL hosted by the upstream application containing the protected resources',
      default: '/protected'
    }
  ];

  inquirer.prompt(questions, function(answers) {
    var new_config = {
      proxy: {
        port: answers.proxy_port,
        upstreamApps: [
          'app'
        ]
      },
      siteminder: {
        smagentname: answers.siteminder_smagentname
      },
      upstreamApps: {
        app: {
          hostname: answers.upstream_app_hostname,
          port: answers.upstream_app_port,
          logoff: answers.logoff_path,
          not_authenticated: answers.not_authenticated_path,
          bad_login: answers.bad_login_path,
          bad_password: answers.bad_password_path,
          account_locked: answers.account_locked_path,
          protected_by_default: false,
          path_filters: [
            { url: answers.protected_path, protected: true }
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
