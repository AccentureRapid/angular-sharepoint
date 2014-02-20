angular.module('spRequestDigestMock', [])
  .factory('$spRequestDigest', function() {
    'use strict';

    var fn = function() {
      return fn.value;
    };
    fn.value = 'requestDigest';

    return fn;
  });
