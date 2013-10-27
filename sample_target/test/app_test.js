var fs = require('fs');
var json = fs.read('./config.json', 'utf8');
var fakeminder_config = JSON.parse(json);
var base_url = fakeminder_config.target_site.root;
var public_url = base_url + fakeminder_config.target_site.urls.public;

casper.test.begin('Verify homepage', 4, function suite(test) {
  casper.start(public_url, function() {
    test.assertHttpStatus(200, 'Homepage loaded ok');
    test.assertExists('a[href="' + fakeminder_config.target_site.urls.logoff + '"]', 'Has a link to the logoff page');
    test.assertExists('a[href="' + fakeminder_config.target_site.urls.protected + '"]', 'Has a link to the protected folder');
    test.assertExists('a[href="/public/logon"]');
  });

  casper.run(function() {
    test.done();
  });
});
