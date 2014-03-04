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

var _ = require('underscore');

var matchUrlAgainstPath = function(url, path, path_url, wildcard) {
  // Match the path if it is an exact match with the URL.
  if (path_url === url) {
    return path;
  }

  // Match the path if it is a leading wildcard and the URL ends with with the path
  if (wildcard === 'leading' && url.indexOf(path_url) === url.length - path_url.length) {
    return path;
  }

  // Match the path if it is a trailing wildcard and the URL starts with the path
  if (wildcard === 'trailing' && url.indexOf(path_url) === 0) {
    return path;
  }

  // Match the path if it is a combined wildcard and the URL contains the path
  if (wildcard === 'combined' && url.indexOf(path_url) !== -1) {
    return path;
  }
};

module.exports.getPathFilter = function(url_config, url) {
  var result = { url: "{default}", protected: url_config.protected_by_default },
      i,
      path,
      path_url,
      wildcard,
      path_segments_regex = /^\{(\d*)\}/,
      path_segments_match,
      url_segments,
      match;

  if (!url_config.path_filters || !_.isArray(url_config.path_filters)) {
    return result;
  }

  url = require('url').parse(url).pathname;

  for (i = 0; i < url_config.path_filters.length; i++) {
    wildcard = undefined;
    path = url_config.path_filters[i];
    path_url = path.url;

    // Remove trailing slash characters.
    if (path_url[path_url.length - 1] === '/') {
      path_url = path_url.slice(0, -1);
    }

    // Identify how many path segments to skip
    path_segments_match = path_url.match(path_segments_regex);
    if (path_segments_match) {
      // Remove the filter component from the path so that it can be matched as a literal.
      path_url = path_url.replace(path_segments_match[0], '');
      // Slice up the path into segments and remove the number of leading path segments
      // specified in the path filter.
      url_segments = url.split('/');
      url_segments = url_segments.slice(Number(path_segments_match[1]) + 1);
      url = '/' + url_segments.join('/');
    }

    // Identify leading wildcard paths.
    if (path_url[0] === '*') {
      wildcard = 'leading';
      // Remove the wildcard from the path.
      path_url = path_url.slice(1, path_url.length);
    }

    // Identify trailing wildcard paths.
    if (path_url[path_url.length - 1] === '*') {
      if (wildcard === 'leading') {
        wildcard = 'combined';
      } else {
        wildcard = 'trailing';
      }

      // Remove the wildcard from the path.
      path_url = path_url.slice(0, -1);
    }

    match = matchUrlAgainstPath(url, path, path_url, wildcard);
    if (match) {
      result = match;
      break;
    }
  }

  // Return a cloned version of the result to avoid mutation.
  return { url: result.url, protected: result.protected };
};

module.exports.resolve = function(url, path_filter) {
  var path_segments_regex = /^\{(\d*)\}/,
      path_segments_match,
      parsed_url = require('url').parse(url),
      path_components_to_skip,
      url_segments;

  // Identify how many path segments to skip
  path_segments_match = path_filter.match(path_segments_regex);
  if (path_segments_match) {
    // Remove the filter component from the path so that it can be matched as a literal.
    path_filter = path_filter.replace(path_segments_match[0], '');

    // Extract the number path segments to skip.
    path_components_to_skip = Number(path_segments_match[1]);

    // Remove all segments from the URL path that exist after the number of segments
    // specified by the path filter.

    url_segments = parsed_url.pathname.split('/');
    url_segments.shift();
    url_segments = url_segments.slice(0, path_components_to_skip);
    url_segments.push();
    parsed_url.pathname = '/' + url_segments.join('/') + path_filter;
  } else {
    parsed_url.pathname = path_filter;
    if (parsed_url.pathname[0] !== '/') {
      parsed_url.pathname = '/' + parsed_url.pathname;
    }
  }

  return require('url').format(parsed_url);
};