var upstreamApp = { url: 'http://localhost:8000', logoff: '/system/logout' };
var logon_url = '/public/logon';
var protected_url = '/protected';
var logoff_url = upstreamApp.logoff;

/*
 * Homepage
 */
casper.test.begin('Verify homepage', 4, function suite(test) {
  casper.start(upstreamApp.url, function() {
    test.assertHttpStatus(200);
    test.assertExists('a[href="' + upstreamApp.logoff + '"]', 'Has a link to the logoff page');
    test.assertExists('a[href="' + protected_url + '"]', 'Has a link to the protected folder');
    test.assertExists('a[href="' + logon_url + '"]', 'Has a link to the login page');
  });

  casper.run(function() {
    test.done();
  });
});

/*
 * Logoff page
 */
casper.test.begin('Verify logoff page', 3, function suite(test) {
  casper.start(upstreamApp.url);

  casper.then(function() {
    this.click('a[href="' + upstreamApp.logoff + '"]');
  });

  casper.then(function() {
    test.assertHttpStatus(200);
    test.assertTitle('Logoff');
    test.assertTextExists('Your are now logged off. Have a nice day!');
  });

  casper.run(function() {
    test.done();
  });
});

/*
 * Protected page
 */
casper.test.begin('Verify protected page', 3, function suite(test) {
  casper.start(upstreamApp.url);

  casper.then(function() {
    this.click('a[href="' + protected_url + '"]');
  });

  casper.then(function() {
    test.assertHttpStatus(200);
    test.assertTitle('Not authenticated');
    test.assertTextExists('Your are not authenticated. Please login before accessing this resource.');
  });

  casper.run(function() {
    test.done();
  });
});

/*
 * Login page
 */
casper.test.begin('Verify login page', 4, function suite(test) {
  casper.start(upstreamApp.url);

  casper.then(function() {
    this.click('a[href="' + logon_url + '"]');
  });

  casper.then(function() {
    test.assertHttpStatus(200);
    test.assertTitle('Login');
    test.assertTextExists('Please enter your username and password then click Login.');
    test.assertExists('input#TARGET[value="' + protected_url + '"]')
  });

  casper.run(function() {
    test.done();
  });
});

/*
 * Login with valid credentials
 */
casper.test.begin('Login with valid credentials', 6, function suite(test) {
  casper.start(upstreamApp.url + logon_url);

  casper.then(function() {
    this.fill('form#logonform', {
      'USERNAME': 'bob',
      'PASSWORD': 'test1234',
      'TARGET': protected_url
    }, true);
  });

  casper.then(function() {
    test.assertHttpStatus(200);
    test.assertTitle('Protected');
    test.assertTextExists('client-id');
    test.assertTextExists('cid123');
    test.assertTextExists('user-id');
    test.assertTextExists('uid456');
  });

  casper.thenOpen(logoff_url);

  casper.run(function() {
    test.done();
  });
});

/*
 * Login with an invalid user ID
 */
casper.test.begin('Login with an invalid user ID', 2, function suite(test) {
  casper.start(upstreamApp.url + logon_url);

  casper.then(function() {
    this.fill('form#logonform', {
      'USERNAME': 'bob111',
      'PASSWORD': 'test1234',
      'TARGET': protected_url
    }, true);
  });

  casper.then(function() {
    test.assertHttpStatus(200);
    test.assertTitle('Bad Login');
  });

  casper.run(function() {
    test.done();
  });
});

/*
 * Login with an invalid password
 */
casper.test.begin('Login with an invalid password', 2, function suite(test) {
  casper.start(upstreamApp.url + logon_url);

  casper.then(function() {
    this.fill('form#logonform', {
      'USERNAME': 'bob',
      'PASSWORD': 'test12345',
      'TARGET': protected_url
    }, true);
  });

  casper.then(function() {
    test.assertHttpStatus(200);
    test.assertTitle('Bad Password');
  });

  casper.run(function() {
    test.done();
  });
});

/*
 * Lockout account
 */
casper.test.begin('View the account lockout page after three login attempts', 7, function suite(test) {
  casper.start(upstreamApp.url + logon_url);

  // Logon successfully first to ensure the number of logon attempts is reset to zero.
  casper.then(function() {
    this.fill('form#logonform', {
      'USERNAME': 'bob',
      'PASSWORD': 'test1234',
      'TARGET': protected_url
    }, true);
  });

  casper.thenOpen(upstreamApp.url + logon_url);

  casper.then(function() {
    this.fill('form#logonform', {
      'USERNAME': 'bob',
      'PASSWORD': 'test12345',
      'TARGET': protected_url
    }, true);
  });

  casper.then(function() {
    test.assertHttpStatus(200);
    test.assertTitle('Bad Password');
  });

  casper.thenOpen(upstreamApp.url + logon_url);

  casper.then(function() {
    this.fill('form#logonform', {
      'USERNAME': 'bob',
      'PASSWORD': 'test12345',
      'TARGET': protected_url
    }, true);
  });

  casper.then(function() {
    test.assertHttpStatus(200);
    test.assertTitle('Bad Password');
  });

  casper.thenOpen(upstreamApp.url + logon_url);

  casper.then(function() {
    this.fill('form#logonform', {
      'USERNAME': 'bob',
      'PASSWORD': 'test12345',
      'TARGET': protected_url
    }, true);
  });

  casper.then(function() {
    test.assertHttpStatus(200);
    test.assertTitle('Account Locked');
    test.assertTextExists('Your account has been locked.');
  });

  casper.run(function() {
    test.done();
  });
});
