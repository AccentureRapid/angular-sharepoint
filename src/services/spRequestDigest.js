/**
 * @ngdoc Service
 * @name ExpertsInside.SharePoint.$spRequestDigest
 * @requires $window
 *
 * @description
 * Reads the request digest from the current page
 *
 * @return {String} request digest
 */
angular.module('ExpertsInside.SharePoint')
  .factory('$spRequestDigest', function($window) {
    'use strict';
    var $spRequestDigestMinErr = angular.$$minErr('$spRequestDigest');

    return function() {
      var requestDigest = $window.document.getElementById('__REQUESTDIGEST');
      if (angular.isUndefined(requestDigest)) {
        throw $spRequestDigestMinErr('notfound', 'Cannot read request digest from DOM.');
      }

      return requestDigest.value;
    };
  });
