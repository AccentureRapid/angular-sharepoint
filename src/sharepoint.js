'use strict';
/**
 * @ngdoc overview
 * @name ExpertsInside.SharePoint
 *
 * @description
 * The main module which holds everything together.
 */
angular.module('ExpertsInside.SharePoint', ['ng'])
  .run(function($window) {
    if (angular.isUndefined($window.ShareCoffee)) {
      console.error("angular-sharepoint requires ShareCoffee to do its job. " +
                    "Please include ShareCoffe.js in your document");
    }
  });
