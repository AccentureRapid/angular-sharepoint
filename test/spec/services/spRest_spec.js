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

    describe('#appendQueryString(url, params)', function() {
      var url;

      beforeEach(function() { url = 'http://my.app'; });

      it('returns the unchanged *url* when *params* is null', function() {
        expect($spRest.appendQueryString(url, null)).to.be.eql(url);
      });

      it('returns the unchanged *url* when *params* is undefined', function() {
        expect($spRest.appendQueryString(url)).to.be.eql(url);
      });

      it('creates a sorted query string from *params* and appends it to the *url*', function() {
        expect($spRest.appendQueryString(url, {foo: 1, bar: 2})).to.be.eql(url+'?bar=2&foo=1');
      });

      it('handles arrays as values in *params*', function() {
        expect($spRest.appendQueryString(url, {foo: [1,2]})).to.be.eql(url+'?foo=1,2');
      });

      it('correctly appends it to an existing query string in *url*', function() {
        expect($spRest.appendQueryString(url + '?bar', {foo: 1})).to.be.eql(url+'?bar&foo=1');
      });
    });

    describe('#normalizeParams(params)', function() {
      it('prefixes keys with $ when needed', function() {
        var normalized = $spRest.normalizeParams({
          select: 'bar'
        });

        expect(normalized).to.be.eql({ $select: 'bar' });
      });

      it('replaces empty params with undefined', function() {
        expect($spRest.normalizeParams({})).to.be.undefined;
      });

      it('replaces null params with undefined', function() {
        expect($spRest.normalizeParams(null)).to.be.undefined;
      });

      it('removes invalid param keys', function() {
        var normalized = $spRest.normalizeParams({foo: 'bar'});

        expect(normalized).to.be.equal(undefined);
      });

      it('warns about invalid param keys', inject(function($log) {
        sinon.spy($log, 'warn');

        $spRest.normalizeParams({foo: 'bar'});

        expect($log.warn).to.have.been.calledWith('Invalid param key: $foo');

        $log.warn.restore();
      }));

      it('does not modify the input', function() {
        var params = {select: 'foo'};

        $spRest.normalizeParams(params);

        expect(params).to.be.eql({select: 'foo'});
      });
    });
  });
});
