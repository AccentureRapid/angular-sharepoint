/**
 * @ngdoc object
 * @name ExpertsInside.SharePoint.JSOM.$spClientContext
 *
 * @description The `$spClientContext` creates a SP.ClientContext
 *  instance and extends it with methods that return AngularJS
 *  promises for async opertations.
 *
 * @example
 * ```js
   var ctx = $spClientContext.create();
   ctx.$load(ctx.get_web()).then(function(web) {
     $scope.webTitle = web.get_title();
   });
   ctx.$executeQueryAsync().then(function() {
     $log.debug('executeQuery done!');
   })
 * ```
 */
angular.module('ExpertsInside.SharePoint.JSOM')
  .factory('$spClientContext', function($window, $q) {
    'use strict';
    // var $spClientContextMinErr = angular.$$minErr('$spClientContext');

    var spContext = {
      /**
       * @ngdoc function
       * @name ExpertsInside.SharePoint.JSOM.$spClientContext#create
       * @methodOf ExpertsInside.SharePoint.JSOM.$spClientContext
       *
       * @description Creates a SP.ClientContext instance with the
       *  current AppWeb Url and adds custom methods.
       *
       *  - `$load`: Wraps the native SP.ClientContext#load method
       *    and returns a promise that resolves with the loaded object 
       *    when executeQueryAsync resolves
       *
       *  - `$executeQueryAsync`: Wraps the native SP.ClientContext#executeQueryAsync
       *    method and returns a promise that resolves after the query is executed.
       *
       * @returns {Object} SP.ClientContext instance
       */
      create: function() {
        var ctx = new $window.SP.ClientContext(ShareCoffee.Commons.getAppWebUrl());

        ctx.$$awaitingLoads = [];

        ctx.$load = function() {
          var args = Array.prototype.slice.call(arguments, 0);
          var deferred = $q.defer();

          $window.SP.ClientContext.prototype.load.apply(ctx, arguments);

          ctx.$$awaitingLoads.push({
            deferred: deferred,
            args: args
          });

          return deferred.promise;
        };

        ctx.$executeQueryAsync = function() {
          var deferred = $q.defer();

          ctx.executeQueryAsync(function() {
            angular.forEach(ctx.$$awaitingLoads, function(load) {
              var deferredLoad = load.deferred;
              deferredLoad.resolve.apply(deferredLoad, load.args);
            });
            deferred.resolve(ctx);
            ctx.$$awaitingLoads.length = 0;
          }, function() {
            var errorArgs = arguments;
            angular.forEach(ctx.$$awaitingLoads, function(load) {
              var deferredLoad = load.deferred;
              deferredLoad.reject.apply(deferredLoad, errorArgs);
            });
            deferred.reject.apply(deferred, errorArgs);
            ctx.$$awaitingLoads.length = 0;
          });

          return deferred.promise;
        };

        return ctx;
      }
    };

    return spContext;
  });
