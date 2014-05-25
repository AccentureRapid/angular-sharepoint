/**
 * @ngdoc service
 * @name ExpertsInside.SharePoint.$spUser
 * @requires ExpertsInside.SharePoint.$spRest
 * @requires ExpertsInside.SharePoint.$spConvert
 *
 * @description Load user information via UserProfiles REST API
 *
 */
angular.module('ExpertsInside.SharePoint')
  .factory('$spUser', function($http, $spRest, $spConvert) {
    'use strict';
    var $spUserMinErr = angular.$$minErr('$spUser');

    var $spUser = {
      $decorateResult: function(result, httpConfig) {
        if (angular.isUndefined(result.$resolved)) {
          result.$resolved = false;
        }
        result.$raw = null;
        result.$promise = $http(httpConfig).then(function(response) {
          var data = response.data;

          if (angular.isDefined(data)) {
            result.$raw = data;
            angular.extend(result, $spConvert.userResult(data));
          } else {
            throw $spUserMinErr('badresponse', 'Response does not contain a valid user result.');
          }

          result.$resolved = true;

          return result;
        });

        return result;
      },

      current: function() {
        var properties = new ShareCoffee
          .UserProfileProperties(ShareCoffee.Url.GetMyProperties);

        var httpConfig = ShareCoffee.REST.build.read.for.angularJS(properties);
        httpConfig.transformResponse = $spRest.transformResponse;

        var result = {};

        return $spUser.$decorateResult(result, httpConfig);
      },

      get: function(accountName) {
        var properties = new ShareCoffee
          .UserProfileProperties(ShareCoffee.Url.GetProperties, accountName);

        var httpConfig = ShareCoffee.REST.build.read.for.angularJS(properties);
        httpConfig.transformResponse = $spRest.transformResponse;

        var result = {};

        return $spUser.$decorateResult(result, httpConfig);
      },
    };

    return $spUser;
  });
