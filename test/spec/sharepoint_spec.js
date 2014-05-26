describe('ExpertsInside.SharePoint', function() {
  describe('when ShareCoffe is not available', function() {
    beforeEach(inject(function($window) {
      $window.ShareCoffee = undefined;
    }));
    it('throws an Error when module is run', inject(function($injector, $log) {
      sinon.spy($log, "error");
      var runBlocks = angular.module('ExpertsInside.SharePoint')._runBlocks;

      $injector.invoke(runBlocks[0]);

      expect($log.error).to.have.been.called;

      $log.error.restore();
    }));
  });
});
