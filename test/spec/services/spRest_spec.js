describe('ExpertsInside.SharePoint', function() {
  describe('Service: $spRest', function() {
    var $spRest,
        apiRootUrl,
        requestDigest;

    beforeEach(module('ExpertsInside.SharePoint'));
    beforeEach(inject(function(_$spRest_) {
      $spRest = _$spRest_;
      sinon.stub(ShareCoffee.Commons, 'getApiRootUrl')
        .returns(apiRootUrl = 'https://test.sharepoint.com/sites/test/app/_api/');
      sinon.stub(ShareCoffee.Commons, 'getFormDigest')
        .returns(requestDigest = 'requestDigest');
    }));
    afterEach(function() {
      ShareCoffee.Commons.getApiRootUrl.restore();
      ShareCoffee.Commons.getFormDigest.restore();
    });

    describe('.transformResponse(json)', function() {
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

    describe('.buildQueryString(url, params)', function() {
      it('returns an empty string when *params* is null', function() {
        expect($spRest.buildQueryString(null)).to.be.eql('');
      });

      it('returns an empty string when *params* is undefined', function() {
        expect($spRest.buildQueryString()).to.be.eql('');
      });

      it('creates a sorted query string from *params*', function() {
        expect($spRest.buildQueryString({foo: 1, bar: 2})).to.be.eql('bar=2&foo=1');
      });

      it('handles array values in *params*', function() {
        expect($spRest.buildQueryString({foo: [1,2,2]})).to.be.eql('foo=1,2');
      });
    });

    describe('.normalizeParams(params)', function() {
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

    describe('.appendQueryString(url, params)', function() {
      var url;
      beforeEach(function() { url = 'http://my.app'; });

      it('returns the original *url* when *params* leads to an empty query string', function () {
        expect($spRest.appendQueryString(url, {})).to.be.eql(url);
      });

      it('adds the query string to the url', function () {
        expect($spRest.appendQueryString(url, {$select: 'foo'})).to.be.eql(url + '?$select=foo');
      });

      it('correctly appends the query string to an url which already has one', function () {
        expect($spRest.appendQueryString(url + '?bar', {$select: 'foo'})).to.be.eql(url + '?bar&$select=foo');
      });
    });

    describe('.createPayload(item)', function() {
      it('creates JSON from item', function() {
        var item = {
          foo: 1
        };

        expect($spRest.createPayload(item)).to.be.eql('{"foo":1}');
      });

      it('removes properties starting with $ from the payload', function() {
        var item = {
          foo: 1,
          $bar: 2
        };

        expect($spRest.createPayload(item)).to.be.eql('{"foo":1}');
        expect(item).to.have.property('$bar');
      });

      it('removes read only properties from the payload', function() {
        var item = {
          foo: 1,
          bar: 2,
          $$readOnlyFields: ['bar']
        };

        expect($spRest.createPayload(item)).to.be.eql('{"foo":1}');
        expect(item).to.have.property('bar');
      });
    });

    describe('.buildHttpConfig(list, action, options)', function() {
      var list, listUrl;

      beforeEach(function() {
        list = { $$relativeUrl:  "web/Lists/getByTitle('Test')" };
        listUrl = list.$$relativeUrl;
      });

      it('sets transformResponse on the httpConfig', function() {
        expect($spRest.buildHttpConfig(list).transformResponse).to.be.equal($spRest.transformResponse);
      });

      it('creates a query string from *options*.query and adds it to the url', function() {
        var httpConfig = $spRest.buildHttpConfig(list, null, {query: {select: ['Id', 'Title']}});

        expect(httpConfig.url).to.be.equal(listUrl + '/items?$select=Id,Title');
      });

      it('when List is in host web, adds @target parameter to url', function() {
        list.$$inHostWeb = true;
        sinon.stub(ShareCoffee.Commons, 'getHostWebUrl').returns('http://host.web');

        var httpConfig = $spRest.buildHttpConfig(list, 'query');

        expect(httpConfig.url).to.be.contain('@target');

        ShareCoffee.Commons.getHostWebUrl.restore();
      });

      describe('when *action* is "get"', function() {
        it('sets httpConfig.url to the url of the item', function() {
          var httpConfig = $spRest.buildHttpConfig(list, 'get', {id: 1});

          expect(httpConfig.url).to.be.equal(apiRootUrl + listUrl + '/items(1)');
        });

        it('throws when *options*.id is not set', function() {
          expect(function() { $spRest.buildHttpConfig(list, 'get'); }).to.throw(Error, '[$spRest:options:get]');
        });

        it('sets correct httpConfig.headers', function() {
          var httpConfig = $spRest.buildHttpConfig(list, 'get', {id: 1});

          expect(httpConfig.headers).to.be.eql({
            'Accept': 'application/json;odata=verbose'
          });
        });
      });

      describe('when *action* is "query"', function() {
        it('sets httpConfig.url to the items root url', function() {
          var httpConfig = $spRest.buildHttpConfig(list, 'query');

          expect(httpConfig.url).to.be.equal(apiRootUrl + listUrl + '/items');
        });

        it('sets correct httpConfig.headers', function() {
          var httpConfig = $spRest.buildHttpConfig(list, 'query');

          expect(httpConfig.headers).to.be.eql({
            'Accept': 'application/json;odata=verbose'
          });
        });
      });

      describe('when *action* is "create"', function() {
        it('throws when *options*.item is not set', function() {
          expect(function() { $spRest.buildHttpConfig(list, 'create'); }).to.throw(Error, '[$spRest:options:create]');
        });

        it('sets httpConfig.url to the items root url', function() {
          var httpConfig = $spRest.buildHttpConfig(list, 'create', {item: {}});

          expect(httpConfig.url).to.be.equal(apiRootUrl + listUrl + '/items');
        });

        it('sets httpConfig.data to the stringified item', function() {
          sinon.spy($spRest, 'createPayload');
          var options = {item: {foo: 1}};
          var httpConfig = $spRest.buildHttpConfig(list, 'create', options);

          expect($spRest.createPayload).to.have.been.calledWith(options.item);
          expect(httpConfig.data).to.be.equal($spRest.createPayload.returnValues[0]);

          $spRest.createPayload.restore();
        });

        it('sets correct httpConfig.headers', function() {
          var httpConfig = $spRest.buildHttpConfig(list, 'create', {item: {}});

          expect(httpConfig.headers).to.be.eql({
            'Accept': 'application/json;odata=verbose',
            'Content-Type': 'application/json;odata=verbose',
            'X-RequestDigest': requestDigest
          });
        });

        it('removes $expand from query properties', function() {
          var httpConfig = $spRest.buildHttpConfig(list, 'create', {query: { $expand: 'Foo/Id' }, item: {}});

          expect(httpConfig.url).to.not.contain('$expand');
        });
      });

      describe('when *action* is "update"', function() {
        var item;
        beforeEach(function() {
          item = {
            Id: 1,
            __metadata: {
              type: 'SP.Data.TestListItem',
              etag: '1',
              uri: apiRootUrl + listUrl + '/items(1)'
            }
          };
        });

        it('throws when *options*.item is not set', function() {
          expect(function() { $spRest.buildHttpConfig(list, 'update'); })
            .to.throw(Error, '[$spRest:options:update]');
        });
        it('throws when *options*.item.__metadata is not set', function() {
          expect(function() { $spRest.buildHttpConfig(list, 'update', {item: {}}); })
            .to.throw(Error, '[$spRest:options:update]');
        });

        it('sets correct httpConfig.headers', function() {
          var httpConfig = $spRest.buildHttpConfig(list, 'update', {item: item});

          expect(httpConfig.headers).to.be.eql({
            'Accept': 'application/json;odata=verbose',
            'Content-Type': 'application/json;odata=verbose',
            'X-RequestDigest': requestDigest,
            'If-Match': item.__metadata.etag,
            'X-HTTP-Method': 'MERGE'
          });
        });

        it('sets the "If-Match" property in httpConfig.header to "*" when options.force is true', function() {
          var httpConfig = $spRest.buildHttpConfig(list, 'update', {item: item, force: true});

          expect(httpConfig.headers).to.have.property('If-Match', '*');
        });

        it('sets httpConfig.data to the stringified item', function() {
          sinon.spy($spRest, 'createPayload');
          var options = {item: item};
          var httpConfig = $spRest.buildHttpConfig(list, 'update', options);

          expect($spRest.createPayload).to.have.been.calledWith(options.item);
          expect(httpConfig.data).to.be.equal($spRest.createPayload.returnValues[0]);

          $spRest.createPayload.restore();
        });

        it('sets httpConfig.url to the url of the item', function() {
          var options = {item: item};
          var httpConfig = $spRest.buildHttpConfig(list, 'update', options);

          expect(httpConfig.url).to.be.equal(item.__metadata.uri);
        });
      });

      describe('when *action* is "delete"', function() {
        var item;
        beforeEach(function() {
          item = {
            Id: 1,
            __metadata: {
              type: 'SP.Data.TestListItem',
              etag: '1',
              uri: apiRootUrl + listUrl + '/items(1)'
            }
          };
        });

        it('throws when *options*.item is not set', function() {
          expect(function() { $spRest.buildHttpConfig(list, 'delete'); })
            .to.throw(Error, '[$spRest:options:delete]');
        });
        it('throws when *options*.item.__metadata is not set', function() {
          expect(function() { $spRest.buildHttpConfig(list, 'delete', {item: {}}); })
            .to.throw(Error, '[$spRest:options:delete]');
        });

        it('sets correct httpConfig.headers', function() {
          var httpConfig = $spRest.buildHttpConfig(list, 'delete', {item: item});

          expect(httpConfig.headers).to.be.eql({
            'Accept': 'application/json;odata=verbose',
            'Content-Type': 'application/json;odata=verbose',
            'X-RequestDigest': requestDigest,
            'If-Match': '*'
          });
        });

        it('sets httpConfig.url to the url of the item', function() {
          var options = {item: item};
          var httpConfig = $spRest.buildHttpConfig(list, 'delete', options);

          expect(httpConfig.url).to.be.equal(item.__metadata.uri);
        });
      });
    });
  });
});
