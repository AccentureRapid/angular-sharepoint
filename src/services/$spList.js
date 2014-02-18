/**
 * @ngdoc service
 * @name ExpertsInside.SharePoint.$spList
 * @requires $http, $q, $spPageContextInfo
 *
 * @description
 * A factory which creates a list object that lets you interact with SharePoint Lists via the
 * SharePoint REST API
 *
 * The returned list object has action methods which provide high-level behaviors without
 * the need to interact with the low level {@link ng.$http $http} service.
 *
 * @return {Object} A list "class" object with the default set of resource actions
 */
angular.module('ExpertsInside.SharePoint')
  .factory('$spList', function(/* $http, */ /* $q, */ /* $spPageContextInfo */) {
    'use strict';

    function List() {
    }

    function listFactory() {
      return new List();
    }

    return listFactory;
  });
