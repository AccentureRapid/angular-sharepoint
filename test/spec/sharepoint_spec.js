describe('ExpertsInside.SharePoint', function() {
  describe('when ShareCoffe is not available', function() {
    beforeEach(function() {
      ShareCoffee = undefined;
    });
    it('throws an Error when module is run', inject(function($injector) {
      var runBlocks = angular.module('ExpertsInside.SharePoint')._runBlocks;
      expect(function() {
        $injector.invoke(runBlocks[0]);
      }).to.throw(Error, "a");
    }));
  });
});
