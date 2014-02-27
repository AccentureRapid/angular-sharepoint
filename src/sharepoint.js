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
  .run(function() {
    var sharepointMinErr = angular.$$minErr('sharepoint');

    if (angular.isUndefined(ShareCoffee)) {
      throw sharepointMinErr(
        "noShareCoffee", "angular-sharepoint depends on ShareCoffee to do its job." +
        "Include ShareCoffe seperately before angular-sharepoint."
      );
    }
  });
