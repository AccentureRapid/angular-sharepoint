describe('ExpertsInside.SharePoint', function() {
  describe('Service: $spRequestDigest', function() {
    var $spRequestDigest,
        $window;

    beforeEach(module('ExpertsInside.SharePoint'));
    beforeEach(inject(function(_$spRequestDigest_, _$window_) {
      $spRequestDigest = _$spRequestDigest_;
      $window = _$window_;
    }));

    it('get request item from DOM element with id "__REQUESTDIGEST"', function() {
      sinon.stub($window.document, 'getElementById').withArgs("__REQUESTDIGEST").returns({value: 'requestDigest'});

      expect($spRequestDigest()).to.be.equal('requestDigest');

      $window.document.getElementById.restore();
    });

    it('throws an error when the DOM element cannot be found"', function() {
      sinon.stub($window.document, 'getElementById').withArgs("__REQUESTDIGEST").returns(undefined);

      expect(function() { $spRequestDigest(); }).to.throw(Error, '[$spRequestDigest:notfound]');

      $window.document.getElementById.restore();
    });
  });
});
