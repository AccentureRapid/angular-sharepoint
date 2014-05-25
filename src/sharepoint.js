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
angular.module('ExpertsInside.SharePoint', ['ng'])
  .run(function($window) {
    if (angular.isUndefined($window.ShareCoffee)) {
      console.error("angular-sharepoint requires ShareCoffee to do its job. " +
                    "Please include ShareCoffe.js in your document");
    }
  });
