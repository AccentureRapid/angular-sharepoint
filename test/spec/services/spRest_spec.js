describe('ExpertsInside.SharePoint', function() {
  describe('Service: $spRest', function() {
    var $spRest;

    beforeEach(module('ExpertsInside.SharePoint'));
    beforeEach(inject(function(_$spRest_) {
      $spRest = _$spRest_;
    }));

    describe('#transformResponse(json)', function() {
      it('returns an empty object when *json* is undefined', function() {
        expect($spRest.transformResponse(undefined)).to.be.eql({});
      });
      it('returns an empty object when *json* is null', function() {
        expect($spRest.transformResponse(null)).to.be.eql({});
      });
      it('returns an empty object when *json* is blank', function() {
        expect($spRest.transformResponse('')).to.be.eql({});
      });
      it('returns the object when *json* contains a single object', function() {
        var obj = { foo: 'bar' };
        var json = angular.toJson({ d: obj });

        expect($spRest.transformResponse(json)).to.be.eql(obj);
      });
      it('returns an array when *json* contains multiple objects', function() {
        var arr = [1, 2];
        var json = angular.toJson({ d: { results: arr }});

        expect($spRest.transformResponse(json)).to.be.eql(arr);
      });
    });
  });
});
