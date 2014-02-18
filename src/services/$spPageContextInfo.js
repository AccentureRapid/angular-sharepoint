/**
 * @ngdoc object
 * @name ExpertsInside.SharePoint.$spPageContextInfo
 * @requires $window
 *
 * @description
 * Wraps the global '_spPageContextInfo' object in an angular service
 *
 * @return {object} $spPageContextInfo Copy of the global '_spPageContextInfo' object
 */
angular.module('ExpertsInside.SharePoint')
  .factory('$spPageContextInfo', function($rootScope, $window) {
    'use strict';

    var $spPageContextInfo = { };
    angular.copy($window._spPageContextInfo, $spPageContextInfo);

    $rootScope.$watch(function() { return $window._spPageContextInfo; }, function(spPageContextInfo) {
      angular.copy(spPageContextInfo, $spPageContextInfo);
    }, true);

    return $spPageContextInfo;
  });
