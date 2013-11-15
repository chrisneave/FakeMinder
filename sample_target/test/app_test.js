var fs = require('fs'),
    json = fs.read('./config.json', 'utf8'),
    fakeminder_config = JSON.parse(json),
    base_url = fakeminder_config.target_site.root,
    homepage_url = base_url + '/';

/*
 * Homepage
 */
casper.test.begin('Verify homepage', 4, function suite(test) {
  casper.start(homepage_url, function() {
    test.assertHttpStatus(200);
    test.assertExists('a[href="' + fakeminder_config.target_site.urls.logoff + '"]', 'Has a link to the logoff page');
    test.assertExists('a[href="' + fakeminder_config.target_site.urls.protected + '"]', 'Has a link to the protected folder');
    test.assertExists('a[href="/public/logon"]', 'Has a link to the login page');
  });

  casper.run(function() {
    test.done();
  });
});

/*
 * Logoff page
 */
casper.test.begin('Verify logoff page', 3, function suite(test) {
  casper.start(homepage_url);

  casper.then(function() {
    this.click('a[href="' + fakeminder_config.target_site.urls.logoff + '"]');
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
  casper.start(homepage_url);

  casper.then(function() {
    this.click('a[href="' + fakeminder_config.target_site.urls.protected + '"]');
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
