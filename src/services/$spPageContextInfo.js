angular.module('ExpertsInside.SharePoint')
  .factory('$spPageContextInfo', function($rootScope, $window) {
    'use strict';

    var me = { };
    angular.copy($window._spPageContextInfo, me);

    $rootScope.$watch(function() { return $window._spPageContextInfo; }, function(spPageContextInfo) {
      angular.copy(spPageContextInfo, me);
    }, true);

    return me;
  });
