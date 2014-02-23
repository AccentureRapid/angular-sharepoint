'use strict';
/**
 * @ngdoc overview
 * @name ExpertsInside.SharePoint
 *
 * @description
 * The main module which holds everything together.
 */
angular.module('ExpertsInside.SharePoint', ['ng'])
  .run(function() {
    var sharepointMinErr = angular.$$minErr('sharepoint');

    if (angular.isUndefined(ShareCoffee)) {
      throw sharepointMinErr(
        "noShareCoffee", "angular-sharepoint depends on ShareCoffee to do its job." +
        "Either include the bundled ShareCoffee + angular-sharepoint file " +
        "or include ShareCoffe seperately before angular-sharepoint."
      );
    }
  });
