var fs = require('fs');
var json = fs.read('./config.json', 'utf8');
var fakeminder_config = JSON.parse(json);
var base_url = fakeminder_config.target_site.root;
var homepage_url = base_url + '/';

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

casper.test.begin('Verify logoff page', 3, function suite(test) {
  casper.start(homepage_url);

  casper.then(function() {
    this.click('a[href="' + fakeminder_config.target_site.urls.logoff + '"]');
  });

  casper.then(function() {
    test.assertHttpStatus(200);
    test.assertTitle('Logoff');
    test.assertTextExists('Your are now logged off. Have a nice day!');
  })

  casper.run(function() {
    test.done();
  })
});

casper.test.begin('Verify protected page', 3, function suite(test) {
  casper.start(homepage_url);

  casper.then(function() {
    this.click('a[href="' + fakeminder_config.target_site.urls.protected + '"]');
  });

  casper.then(function() {
    test.assertHttpStatus(302);
  })

  casper.run(function() {
    test.done();
  })
});
