angular.module('ExpertsInside.SharePoint.Core')
  .factory('$spRest', function($log) {
    'use strict';

    var $spRestMinErr = angular.$$minErr('$spRest');
    var unique = function(arr) {
      return arr.reduce(function(r, x) {
        if (r.indexOf(x) < 0) { r.push(x); }
        return r;
      }, []);
    };

    var validParamKeys = ['$select', '$filter', '$orderby', '$top', '$skip', '$expand', '$sort'];

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

    var $spRest = {
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
      buildQueryString: function(params) {
        var parts = [];
        var keys = getKeysSorted(params);

        angular.forEach(keys, function(key) {
          var value = params[key];
          if (value === null || angular.isUndefined(value)) { return; }
          if (angular.isArray(value)) { value = unique(value).join(','); }
          if (angular.isObject(value)) { value = angular.toJson(value); }

          parts.push(key + '=' + value);
        });
        var queryString = parts.join('&');

        return queryString;
      },
      normalizeParams: function(params) {
        params = angular.extend({}, params); //make a copy
        if (angular.isDefined(params)) {
          angular.forEach(params, function(value, key) {
            if(key.indexOf('$') !== 0) {
              delete params[key];
              key = '$' + key;
              params[key] = value;
            }
            if (validParamKeys.indexOf(key) === -1) {
              $log.warn('Invalid param key: ' + key);
              delete params[key];
            }
          });
        }
        // cannot use angular.equals(params, {}) to check for empty object,
        // because angular.equals ignores properties prefixed with $
        if (params === null || JSON.stringify(params) === '{}') {
          params = undefined;
        }

        return params;
      },
      appendQueryString: function(url, params) {
        var queryString = $spRest.buildQueryString(params);

        if (queryString !== '') {
          url += ((url.indexOf('?') === -1) ? '?' : '&') + queryString;
        }

        return url;
      },
      createPayload: function(item) {
        var payload = angular.extend({}, item);
        if (angular.isDefined(item.$$readOnlyFields)) {
          angular.forEach(item.$$readOnlyFields, function(readOnlyField) {
            delete payload[readOnlyField];
          });
        }
        return angular.toJson(payload);
      },
      buildHttpConfig: function(list, action, options) {
        var baseUrl = list.$$relativeUrl + '/items';
        var httpConfig = {
          url: baseUrl
        };
        if (list.$$inHostWeb) {
          httpConfig.hostWebUrl = ShareCoffee.Commons.getHostWebUrl();
        }

        action = angular.isString(action) ? action.toLowerCase() : '';
        options = angular.isDefined(options) ? options : {};
        var query = angular.isDefined(options.query) ? $spRest.normalizeParams(options.query) : {};

        switch(action) {
        case 'get':
          if (angular.isUndefined(options.id)) {
            throw $spRestMinErr('options:get', 'options must have an id');
          }

          httpConfig.url += '(' + options.id + ')';
          httpConfig = ShareCoffee.REST.build.read.for.angularJS(httpConfig);
          break;
        case 'query':
          httpConfig = ShareCoffee.REST.build.read.for.angularJS(httpConfig);
          break;
        case 'create':
          if (angular.isUndefined(options.item)) {
            throw $spRestMinErr('options:create', 'options must have an item');
          }

          if (angular.isDefined(query)) {
            delete query.$expand;
          }

          httpConfig.payload = $spRest.createPayload(options.item);
          httpConfig = ShareCoffee.REST.build.create.for.angularJS(httpConfig);
          break;
        case 'update':
          if (angular.isUndefined(options.item)) {
            throw $spRestMinErr('options:update', 'options must have an item');
          }
          if (angular.isUndefined(options.item.__metadata)) {
            throw $spRestMinErr('options:update', 'options.item must have __metadata');
          }

          query = {}; // does nothing or breaks things, so we ignore it
          httpConfig.url += '(' + options.item.Id + ')';
          httpConfig.payload = $spRest.createPayload(options.item);
          httpConfig.eTag = !options.force && angular.isDefined(options.item.__metadata) ?
            options.item.__metadata.etag : null;

          httpConfig = ShareCoffee.REST.build.update.for.angularJS(httpConfig);
          break;
        case 'delete':
          if (angular.isUndefined(options.item)) {
            throw $spRestMinErr('options:delete', 'options must have an item');
          }
          if (angular.isUndefined(options.item.__metadata)) {
            throw $spRestMinErr('options:delete', 'options.item must have __metadata');
          }

          httpConfig.url += '(' + options.item.Id + ')';
          httpConfig = ShareCoffee.REST.build.delete.for.angularJS(httpConfig);
          break;
        }

        httpConfig.url = $spRest.appendQueryString(httpConfig.url, query);
        httpConfig.transformResponse = $spRest.transformResponse;

        return httpConfig;
      }
    };

    return $spRest;
  });
