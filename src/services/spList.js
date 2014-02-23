/**
 * @ngdoc service
 * @name ExpertsInside.SharePoint.$spList
 * @requires $spRest
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
  .factory('$spList', function($spRest, $http, $log) {
    'use strict';
    var $spListMinErr = angular.$$minErr('$spList');
    var validParamKeys = ['$select', '$filter', '$orderby', '$top', '$skip', '$expand', '$sort'];

    function List(name, defaults) {
      if (!name) {
        throw $spListMinErr('badargs', 'name cannot be blank.');
      }

      this.name = name.toString();
      var upcaseName = this.name.charAt(0).toUpperCase() + this.name.slice(1);
      this.defaults = angular.extend({
        itemType: 'SP.Data.' + upcaseName + 'ListItem'
      }, defaults);
      this.queries = {};
    }

    List.prototype = {
      $baseUrl: function() {
        return "web/lists/getByTitle('" + this.name + "')";
      },
      $appendQueryString: function(baseUrl, params) {
        var url = baseUrl;

        if (params) {
          var parts = [];
          var keys = [];
          for(var key in params) {
            if (params.hasOwnProperty(key)) {
              keys.push(key);
            }
          }
          keys = keys.sort();
          angular.forEach(keys, function(key) {
            var value = params[key];
            if (value === null || angular.isUndefined(value)) { return; }
            if (angular.isArray(value)) { value = value.join(','); }
            if (angular.isObject(value)) { value = angular.toJson(value); }

            parts.push(key + '=' + value);
          });
          url += ((url.indexOf('?') === -1) ? '?' : '&') + parts.join('&');
        }

        return url;
      },
      $buildHttpConfig: function(action, params, args) {
        var baseUrl = this.$baseUrl(),
            httpConfig;

        switch(action) {
        case 'get':
          httpConfig = ShareCoffee.REST.build.read.for.angularJS({
            url: baseUrl + '/items(' + args + ')'
          });
          break;
        case 'query':
          httpConfig = ShareCoffee.REST.build.read.for.angularJS({
            url: baseUrl + '/items'
          });
          break;
        case 'create':
          httpConfig = ShareCoffee.REST.build.create.for.angularJS({
            url: baseUrl + '/items',
            payload: args
          });
          break;
        case 'save':
          httpConfig = ShareCoffee.REST.build.update.for.angularJS({
            url: baseUrl,
            payload: args
          });
          httpConfig.url = args.__metadata.uri; // ShareCoffe doesnt work with absolute urls atm
          break;
        case 'delete':
          httpConfig = ShareCoffee.REST.build.update.for.angularJS({
            url: baseUrl,
          });
          httpConfig.url = args.__metadata.uri;
          break;
        }

        httpConfig.url = this.$appendQueryString(httpConfig.url, params);
        httpConfig.transformResponse = $spRest.transformResponse;

        return httpConfig;
      },
      $normalizeParams: function(params) {
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
      $createResult: function(emptyObject, httpConfig) {
        var result = emptyObject;
        result.$promise = $http(httpConfig).success(function(data) {
          angular.extend(result, data);
          return result;
        });

        return result;
      },
      get: function(id, params) {
        if (angular.isUndefined(id)) {
          throw $spListMinErr('badargs', 'id is required.');
        }
        params = this.$normalizeParams(params);

        var httpConfig = this.$buildHttpConfig('get', params, id);
        console.log(httpConfig);
        console.log(httpConfig);

        return this.$createResult({Id: id}, httpConfig);
      },
      query: function(params) {
        params = this.$normalizeParams(params);

        var httpConfig = this.$buildHttpConfig('query', params);

        return this.$createResult([], httpConfig);
      },
      create: function(data) {
        var type = this.defaults.itemType;
        if (!type) {
          throw $spListMinErr('badargs', 'Cannot create an item without a valid type.' +
                              'Please set the default item type on the list (list.defaults.itemType).');
        }
        var itemDefaults = {
          __metadata: {
            type: type
          }
        };
        var item = angular.extend({}, itemDefaults, data);
        var httpConfig = this.$buildHttpConfig('create', undefined, item);

        return this.$createResult(item, httpConfig);
      },
      save: function(item) {
        if (angular.isUndefined(item.__metadata)) {
          throw $spListMinErr('badargs', 'Item must have __metadata property.');
        }
        var httpConfig = this.$buildHttpConfig('save', undefined, item);

        return this.$createResult(item, httpConfig);
      },
      delete: function(item) {
        if (angular.isUndefined(item.__metadata)) {
          throw $spListMinErr('badargs', 'Item must have __metadata property.');
        }
        var httpConfig = this.$buildHttpConfig('delete', undefined, item);

        return this.$createResult(item, httpConfig);
      },
      addNamedQuery: function(name, createParams) {
        var me = this;
        this.queries[name] = function() {
          var params = createParams.apply(me, arguments);
          return me.query(params);
        };
        return me;
      }
    };

    function listFactory(name, defaults) {
      return new List(name, defaults);
    }
    listFactory.List = List;

    return listFactory;
  });
