/**
 * @ngdoc service
 * @name ExpertsInside.SharePoint.User.$spUser
 * @requires ExpertsInside.SharePoint.Core.$spRest
 * @requires ExpertsInside.SharePoint.Core.$spConvert
 *
 * @description Load user information via UserProfiles REST API
 *
 */
angular.module('ExpertsInside.SharePoint.User')
  .factory('$spUser', function($http, $spRest, $spConvert) {
    'use strict';
    var $spUserMinErr = angular.$$minErr('$spUser');

    var $spUser = {

      /**
       * @private
       * Decorate the result with $promise and $resolved
       */
      $$decorateResult: function(result, httpConfig) {
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

      /**
       * @ngdoc method
       * @name ExpertsInside.SharePoint.User.$spUser#current
       * @methodOf ExpertsInside.SharePoint.User.$spUser
       *
       * @description Get the current signed in user.
       *
       * @returns {Object} user profile properties
       */
      current: function() {
        var properties = new ShareCoffee
          .UserProfileProperties(ShareCoffee.Url.GetMyProperties);

        var httpConfig = ShareCoffee.REST.build.read.for.angularJS(properties);
        httpConfig.transformResponse = $spRest.transformResponse;

        var result = {};

        return $spUser.$$decorateResult(result, httpConfig);
      },

      /**
       * @ngdoc method
       * @name ExpertsInside.SharePoint.User.$spUser#get
       * @methodOf ExpertsInside.SharePoint.User.$spUser
       *
       * @description Get a user by account name
       *
       * @param {string} accountName account name
       *
       * @returns {Object} user profile properties
       */
      get: function(accountName) {
        var properties = new ShareCoffee
          .UserProfileProperties(ShareCoffee.Url.GetProperties, accountName);

        var httpConfig = ShareCoffee.REST.build.read.for.angularJS(properties);
        httpConfig.transformResponse = $spRest.transformResponse;

        var result = {};

        return $spUser.$$decorateResult(result, httpConfig);
      }
    };

    return $spUser;
  });
