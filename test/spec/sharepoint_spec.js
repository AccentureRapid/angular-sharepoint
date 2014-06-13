describe('ExpertsInside.SharePoint', function() {
  var $log,
      $injector,
      $window,
      ShareCoffee;

  beforeEach(inject(function(_$log_, _$injector_, _$window_) {
    $log = _$log_;
    $injector = _$injector_;
    $window = _$window_;
    ShareCoffee = $window.ShareCoffee;

    sinon.spy($log, "warn");
  }));
  afterEach(function() {
    $log.warn.restore();
    $window.ShareCoffee = ShareCoffee;
  });

  describe('when ShareCoffee and plugins are available', function() {
    it('the Core module does not log a warning', function() {
      var runBlocks = angular.module('ExpertsInside.SharePoint.Core')._runBlocks;

      $injector.invoke(runBlocks[0]);

      expect($log.warn).to.not.have.been.called;
    });

    it('the Search module does not log a warning', function() {
      var runBlocks = angular.module('ExpertsInside.SharePoint.Search')._runBlocks;

      $injector.invoke(runBlocks[0]);

      expect($log.warn).to.not.have.been.called;
    });

    it('the User module does not log a warning', function() {
      var runBlocks = angular.module('ExpertsInside.SharePoint.User')._runBlocks;

      $injector.invoke(runBlocks[0]);

      expect($log.warn).to.not.have.been.called;
    });
  });

  describe('when ShareCoffee is not available', function() {
    beforeEach(function() {
      $window.ShareCoffee = undefined;
    });
    it('the Core module logs a warning when loaded', function() {
      var runBlocks = angular.module('ExpertsInside.SharePoint.Core')._runBlocks;

      $injector.invoke(runBlocks[0]);

      expect($log.warn).to.have.been.calledWithMatch(/ShareCoffee\.js/);
    });
  });

  describe('when ShareCoffe.Search is not available', function() {
    beforeEach(function() {
      $window.ShareCoffee = {};
    });

    it('the Search module logs a warning when loaded', function() {
      var runBlocks = angular.module('ExpertsInside.SharePoint.Search')._runBlocks;

      $injector.invoke(runBlocks[0]);

      expect($log.warn).to.have.been.calledWithMatch(/ShareCoffee\.Search\.js/);
    });
  });

  describe('when ShareCoffe.UserProfiles is not available', function() {
    beforeEach(function() {
      $window.ShareCoffee = {};
    });

    it('the User module logs a warning when loaded', function() {
      var runBlocks = angular.module('ExpertsInside.SharePoint.User')._runBlocks;

      $injector.invoke(runBlocks[0]);

      expect($log.warn).to.have.been.calledWithMatch(/ShareCoffee\.UserProfiles\.js/);
    });
  });

  describe('when SP.ClientContext is not available', function() {
    beforeEach(function() {
      $window.SP = {};
    });
    it('the JSOM module logs a warning when loaded', function() {
      var runBlocks = angular.module('ExpertsInside.SharePoint.JSOM')._runBlocks;

      $injector.invoke(runBlocks[0]);

      expect($log.warn).to.have.been.calledWithMatch(/SharePoint Javascript Runtime/);
    });
  });
});
