/**
 * @ngdoc service
 * @name ExpertsInside.SharePoint.Search.$spSearch
 * @requires ExpertsInside.SharePoint.Core.$spRest
 * @requires ExpertsInside.SharePoint.Core.$spConvert
 *
 * @description Query the Search via REST API
 *
 */
angular.module('ExpertsInside.SharePoint.Search')
  .factory('$spSearch', function($http, $spRest, $spConvert) {
    'use strict';
    var $spSearchMinErr = angular.$$minErr('$spSearch');

    var search = {
      $$createQueryProperties: function(searchType, properties) {
        var queryProperties;
        switch(searchType) {
        case 'postquery':
          queryProperties = new ShareCoffee.PostQueryProperties();
          break;
        case 'suggest':
          queryProperties = new ShareCoffee.SuggestProperties();
          break;
        default:
          queryProperties = new ShareCoffee.QueryProperties();
          break;
        }

        return angular.extend(queryProperties, properties);
      },

      $decorateResult: function(result, httpConfig) {
        if (angular.isUndefined(result.$resolved)) {
          result.$resolved = false;
        }
        result.$raw = null;
        result.$promise = $http(httpConfig).then(function(response) {
          var data = response.data;

          if (angular.isObject(data)) {
            if(angular.isDefined(data.query)) {
              result.$raw = data.query;
              angular.extend(result, $spConvert.searchResult(data.query));
            } else if (angular.isDefined(data.suggest)) {
              result.$raw = data.suggest;
              angular.extend(result, $spConvert.suggestResult(data.suggest));
            }
          }
          if (angular.isUndefined(result.$raw)) {
            throw $spSearchMinErr('badresponse', 'Response does not contain a valid search result.');
          }
          result.$resolved = true;

          return result;
        });

        return result;
      },

      query: function(properties) {
        properties = angular.extend({}, properties);

        var searchType = properties.searchType;
        delete properties.searchType;

        var queryProperties = search.$$createQueryProperties(searchType, properties);
        var httpConfig = ShareCoffee.REST.build.read.for.angularJS(queryProperties);
        httpConfig.transformResponse = $spRest.transformResponse;

        var result = {};

        return search.$decorateResult(result, httpConfig);
      },

      postquery: function(properties) {
        properties = angular.extend(properties, {searchType: 'postquery'});
        return search.query(properties);
      },

      suggest: function(properties) {
        properties = angular.extend(properties, {searchType: 'suggest'});
        return search.query(properties);
      }
    };

    return search;
  });
