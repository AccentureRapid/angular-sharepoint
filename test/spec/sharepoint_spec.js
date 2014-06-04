describe('ExpertsInside.SharePoint', function() {
  describe('when ShareCoffe is not available', function() {
    beforeEach(inject(function($window) {
      $window.ShareCoffee = undefined;
    }));
    it('the Core module logs a warning when loaded', inject(function($injector, $log) {
      sinon.spy($log, "warn");
      var runBlocks = angular.module('ExpertsInside.SharePoint.Core')._runBlocks;

      $injector.invoke(runBlocks[0]);

      expect($log.warn).to.have.been.calledWithMatch(/ShareCoffee\.js/);

      $log.warn.restore();
    }));
  });

  describe('when ShareCoffe.Search is not available', function() {
    beforeEach(inject(function($window) {
      $window.ShareCoffee = {};
    }));

    it('the Search module logs a warning when loaded', inject(function($injector, $log) {
      sinon.spy($log, "warn");
      var runBlocks = angular.module('ExpertsInside.SharePoint.Search')._runBlocks;

      $injector.invoke(runBlocks[0]);

      expect($log.warn).to.have.been.calledWithMatch(/ShareCoffee\.Search\.js/);

      $log.warn.restore();
    }));
  });

  describe('when ShareCoffe.UserProfiles is not available', function() {
    beforeEach(inject(function($window) {
      $window.ShareCoffee = {};
    }));

    it('the User module logs a warning when loaded', inject(function($injector, $log) {
      sinon.spy($log, "warn");
      var runBlocks = angular.module('ExpertsInside.SharePoint.User')._runBlocks;

      $injector.invoke(runBlocks[0]);

      expect($log.warn).to.have.been.calledWithMatch(/ShareCoffee\.UserProfiles\.js/);

      $log.warn.restore();
    }));
  });

  describe('when SP.ClientContext is not available', function() {
    beforeEach(inject(function($window) {
      $window.SP = {};
    }));
    it('the JSOM module logs a warning when loaded', inject(function($injector, $log) {
      sinon.spy($log, "warn");
      var runBlocks = angular.module('ExpertsInside.SharePoint.JSOM')._runBlocks;

      $injector.invoke(runBlocks[0]);

      expect($log.warn).to.have.been.calledWithMatch(/SharePoint Javascript Runtime/);

      $log.warn.restore();
    }));
  });
});
