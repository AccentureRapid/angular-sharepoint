'use strict';

/**
 * @ngdoc overview
 * @name ExpertsInside.SharePoint
 *
 * @description
 *
 * # ExpertsInside.SharePoint
 *
 * The `ExpertsInside.SharePoint` module provides a high level abstraction for
 * the SharePoint 2013 REST API.
 *
 *
 * ## $spList
 *
 * Interaction with SharePoint Lists similiar to $ngResource.
 * See {@link ExpertsInside.SharePoint.$spList `$spList`} for usage.
 */

angular.module('ExpertsInside.SharePoint.Core', ['ng'])
  .run(function($window, $log) {
    if (angular.isUndefined($window.ShareCoffee)) {
      $log.warn("ExpertsInside.SharePoint.Core module depends on ShareCoffee. " +
                 "Please include ShareCoffee.js in your document");
    }
  });

angular.module('ExpertsInside.SharePoint.List', ['ExpertsInside.SharePoint.Core']);

angular.module('ExpertsInside.SharePoint.Search', ['ExpertsInside.SharePoint.Core'])
  .run(function($window, $log) {
    if (angular.isUndefined($window.ShareCoffee) || angular.isUndefined($window.ShareCoffee.Search)) {
      $log.warn("ExpertsInside.SharePoint.Search module depends on ShareCoffee.Search " +
                 "Please include ShareCoffee.Search.js in your document");
    }
  });

angular.module('ExpertsInside.SharePoint.User', ['ExpertsInside.SharePoint.Core'])
  .run(function($window, $log) {
    if (angular.isUndefined($window.ShareCoffee) || angular.isUndefined($window.ShareCoffee.UserProfiles)) {
      $log.warn("ExpertsInside.SharePoint.User module depends on ShareCoffee.UserProfiles " +
                 "Please include ShareCoffee.UserProfiles.js in your document");
    }
  });

angular.module('ExpertsInside.SharePoint', [
  'ExpertsInside.SharePoint.Core',
  'ExpertsInside.SharePoint.List',
  'ExpertsInside.SharePoint.Search',
  'ExpertsInside.SharePoint.User'
]);

