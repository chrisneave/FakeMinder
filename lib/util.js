var url = require('url');

module.exports.redirectUrlFromRequest = function(req, path) {
  var path_and_query,
      query_and_fragment,
      pathname,
      search,
      hash,
      redirect_url;

  path_and_query = path.split('?');
  pathname = path_and_query[0] || '/';

  if (path_and_query.length > 1) {
    query_and_fragment = path_and_query[1].split('#');
    search = '?' + query_and_fragment[0];
  }

  if (query_and_fragment && query_and_fragment.length > 1) {
    hash = '#' + query_and_fragment[1];
  }

  redirect_url = {
    protocol: req.connection.encrypted ? 'https' : 'http',
    host: req.headers.host,
    pathname: pathname,
    search: search,
    hash: hash
  };

  return url.format(redirect_url);
};
