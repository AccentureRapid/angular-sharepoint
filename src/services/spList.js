/**
 * @ngdoc service
 * @name ExpertsInside.SharePoint.$spList
 * @requires $spPageContextInfo
 *
 * @description
 * A factory which creates a list object that lets you interact with SharePoint Lists via the
 * SharePoint REST API
 *
 * The returned list object has action methods which provide high-level behaviors without
 * the need to interact with the low level $http service.
 *
 * @return {Object} A list "class" object with the default set of resource actions
 */
angular.module('ExpertsInside.SharePoint')
  .factory('$spList', function($spPageContextInfo, $http, $log) {
    'use strict';
    var $spListMinErr = angular.$$minErr('$spList');
    var validParamKeys = ['$select', '$filter', '$orderby', '$top', '$skip', '$expand'];

    function List(name, defaults) {
      this.name = name;
      this.defaults = defaults;
    }

    List.prototype = {
      $baseUrl: function() {
        return $spPageContextInfo.webServerRelativeUrl + "/_api/web/lists/getByTitle('" + this.name + "')";
      },
      $buildHttpConfig: function(action, params, args) {
        var baseUrl = this.$baseUrl();
        var httpConfig = {
          url: baseUrl,
          params: params,
          headers: {
            accept: 'application/json;odata=verbose'
          },
          transformResponse: function (data) {
            var response = JSON.parse(data);
            if (angular.isDefined(response.d)) {
              response = response.d;
            }
            if (angular.isDefined(response.results)) {
              response = response.results;
            }
            return response;
          }
        };

        switch(action) {
        case 'get':
          httpConfig.url = baseUrl + '/items(' + args + ')';
          httpConfig.method = 'GET';
          break;
        case 'query':
          httpConfig.url = baseUrl + '/items';
          httpConfig.method = 'GET';
          break;
        }
        return httpConfig;
      },
      $normalizeParams: function(params) {
        if (angular.isDefined(params)) {
          angular.forEach(params, function(value, key) {
            if(key.indexOf('$') !== 0) {
              delete params[key];
              key = '$' + key;
              params[key] = value;
            }
            if (angular.isArray(value)) {
              params[key] = value.join(',');
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
      get: function(id, params) {
        if (angular.isUndefined(id)) {
          throw $spListMinErr('badargs', 'id is required.');
        }
        params = this.$normalizeParams(params);

        var httpConfig = this.$buildHttpConfig('get', params, id);

        return $http(httpConfig);
      },
      query: function(params) {
        params = this.$normalizeParams(params);

        var httpConfig = this.$buildHttpConfig('query', params);
        console.log(httpConfig);

        return $http(httpConfig);
      },
    };

    function listFactory(name) {
      return new List(name);
    }
    listFactory.List = List;

    return listFactory;
  });
