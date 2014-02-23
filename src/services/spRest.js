angular.module('ExpertsInside.SharePoint')
  .factory('$spRest', function() {
    'use strict';

    function getKeysSorted(obj) {
      var keys = [];
      if (angular.isUndefined(obj) || obj === null) {
        return keys;
      }

      for(var key in obj) {
        if (obj.hasOwnProperty(key)) {
          keys.push(key);
        }
      }
      return keys.sort();
    }

    return {
      transformResponse: function (json) {
        var response = {};
        if (angular.isDefined(json) && json !== null && json !== '') {
          response = angular.fromJson(json);
        }
        if (angular.isObject(response) && angular.isDefined(response.d)) {
          response = response.d;
        }
        if (angular.isObject(response) && angular.isDefined(response.results)) {
          response = response.results;
        }
        return response;
      },
      appendQueryString: function(url, params) {
        var parts = [];
        var keys = getKeysSorted(params);

        angular.forEach(keys, function(key) {
          var value = params[key];
          if (value === null || angular.isUndefined(value)) { return; }
          if (angular.isArray(value)) { value = value.join(','); }
          if (angular.isObject(value)) { value = angular.toJson(value); }

          parts.push(key + '=' + value);
        });
        var queryString = parts.join('&');
        if (queryString !== '') {
          url += ((url.indexOf('?') === -1) ? '?' : '&') + queryString;
        }
        return url;
      },
    };
  });
