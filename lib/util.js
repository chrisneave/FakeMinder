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
