/**
 * @ngdoc object
 * @name ExpertsInside.SharePoint.JSOM.$spClientContext
 *
 * @description The `$spClientContext` creates a SP.ClientContext
 *  instance and empowers it with methods that return AngularJS
 *  promises for async opertations.
 *
 *  - `$load`: Wraps the native SP.ClientContext#load method
 *    and returns a promise that resolves with the loaded object 
 *    when executeQueryAsync resolves
 *
 *  - `$executeQueryAsync`: Wraps the native SP.ClientContext#executeQueryAsync
 *    method and returns a promise that resolves after the query is executed.
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
       * @private
       * Decorate the context with custom methods
       */
      $$decorateContext: function(ctx) {
        ctx.$$empowered = true;
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
      },

      /**
       * @ngdoc function
       * @name ExpertsInside.SharePoint.JSOM.$spClientContext#create
       * @methodOf ExpertsInside.SharePoint.JSOM.$spClientContext
       *
       * @description Creates an empowered SP.ClientContext instance with the
       *  given url.
       *
       * @param {string=} url url for the context
       *
       * @returns {Object} SP.ClientContext instance
       */
      create: function(url) {
        var ctx = new $window.SP.ClientContext(url);

        return spContext.$$decorateContext(ctx);
      },

      /**
       * @ngdoc function
       * @name ExpertsInside.SharePoint.JSOM.$spClientContext#current
       * @methodOf ExpertsInside.SharePoint.JSOM.$spClientContext
       *
       * @description Returns an empowered version of SP.ClientContext.get_current()
       *
       * @returns {Object} SP.ClientContext instance
       */
      current: function() {
        var ctx = new $window.SP.ClientContext.get_current();

        return angular.isDefined(ctx.$$empowered) ? ctx : spContext.$$decorateContext(ctx);
      }
    };

    return spContext;
  });
