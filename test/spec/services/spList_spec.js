describe('ExpertsInside.SharePoint', function() {
  describe('Service: $spList(name, defaults)', function() {
    var $spPageContextInfo,
        $spList,
        $spRequestDigest,
        $httpBackend;

    beforeEach(module('ExpertsInside.SharePoint'));
    beforeEach(module('spRequestDigestMock'));
    beforeEach(inject(function(_$spList_, _$spPageContextInfo_, _$spRequestDigest_, _$httpBackend_) {
      $spList = _$spList_;
      $spPageContextInfo = _$spPageContextInfo_;
      $spRequestDigest = _$spRequestDigest_;
      $httpBackend = _$httpBackend_;
      $spPageContextInfo.webServerRelativeUrl = '/testApp';
    }));

    it('is defined', function() {
      expect($spList).not.to.be.undefined;
    });

    it('is a factory function for list objects', function() {
      expect($spList).to.be.a('function');
      expect($spList('Test')).to.be.instanceOf($spList.List);
    });

    it('throws when no *name* is given', function() {
      expect(function() { $spList(); }).to.throw(Error, '[$spList:badargs] name cannot be blank.');
    });

    it('defaults *defaults* to an object with a single itemType property that gets infered from the list name', function() {
      var list = $spList('test');

      expect(list.defaults).to.be.eql({itemType: 'SP.Data.TestListItem'});
    });

    describe('List', function() {
      var list;

      beforeEach(function() {
        list = $spList('Test', {
          itemType: 'SP.TestListItem'
        });
      });

      it('#$baseUrl()', function() {
        expect(list.$baseUrl()).to.be.equal("/testApp/_api/web/lists/getByTitle('Test')");
      });

      describe('#$normalizeParams(params)', function() {

        it('prefixes keys with $ when needed', function() {
          var normalized = list.$normalizeParams({
            select: 'bar'
          });

          expect(normalized).to.be.eql({ $select: 'bar' });
        });

        it('replaces empty or null params with undefined', function() {
          expect(list.$normalizeParams({})).to.be.undefined;
          expect(list.$normalizeParams(null)).to.be.undefined;
        });

        it('removes invalid param keys', function() {
          var normalized = list.$normalizeParams({foo: 'bar'});

          expect(normalized).to.be.equal(undefined);
        });

        it('warns about invalid param keys', inject(function($log) {
          sinon.spy($log, 'warn');

          list.$normalizeParams({foo: 'bar'});

          expect($log.warn).to.have.been.calledWith('Invalid param key: $foo');

          $log.warn.restore();
        }));

        it('does not modify the input', function() {
          var params = {select: 'foo'};

          list.$normalizeParams(params);

          expect(params).to.be.eql({select: 'foo'});
        });
      });

      describe('#get(id, params)', function() {
        beforeEach(function() {
          $httpBackend.whenGET(/\/testApp\/_api\/web\/lists\/getByTitle\('Test'\)\/items\(1\)/, {
            accept: 'application/json;odata=verbose'
          }).respond(JSON.stringify({
            d: {
              Id: 1
            }
          }));
        });
        afterEach(function() {
          $httpBackend.verifyNoOutstandingExpectation();
          $httpBackend.verifyNoOutstandingRequest();
        });

        it('creates REST call that fetches the item with the given *id*', function() {
          $httpBackend.expectGET("/testApp/_api/web/lists/getByTitle('Test')/items(1)", {
            accept: 'application/json;odata=verbose'
          });

          list.get(1);

          $httpBackend.flush();
        });

        it('creates REST with query *params* that fetches the item with the given *id*', function() {
          $httpBackend.expectGET("/testApp/_api/web/lists/getByTitle('Test')/items(1)?$select=foo", {
            accept: 'application/json;odata=verbose'
          });

          list.get(1, {
            select: 'foo',
          });

          $httpBackend.flush();
        });

        it('returns an object with an Id and $promise property', function() {
          var item = list.get(1);

          expect(item).to.have.property('$promise');
          expect(item).to.have.property('Id', 1);

          $httpBackend.flush();
        });

        it('extends the returned object with the data from the REST response when it resolves', function(done) {
          var item = list.get(1);

          item.$promise.then(function() {
            expect(item.Id).to.be.equal(1);
            done();
          });

          $httpBackend.flush();
        });

        it('throws error when *id* is undefined', function() {
          expect(function() {
            list.get();
          }).to.throw(Error, '[$spList:badargs] id is required.');
        });
      });

      describe('#get(id, params)', function() {
        beforeEach(function() {
          $httpBackend.whenGET(/\/testApp\/_api\/web\/lists\/getByTitle\('Test'\)\/items/, {
            accept: 'application/json;odata=verbose'
          }).respond(JSON.stringify({
            d: {
              results: [
                {Id: 1},
                {Id: 2},
                {Id: 3}
              ]
            }
          }));
        });
        afterEach(function() {
          $httpBackend.verifyNoOutstandingExpectation();
          $httpBackend.verifyNoOutstandingRequest();
        });

        it('creates REST call that fetches all items', function() {
          $httpBackend.expectGET("/testApp/_api/web/lists/getByTitle('Test')/items", {
            accept: 'application/json;odata=verbose'
          });

          list.query();

          $httpBackend.flush();
        });

        it('creates REST with query *params* that queries the list for the items', function() {
          var params = {
            $select: ['foo','bar'],
            $orderby: 'foo',
            $sort: 'bar',
            $top: 2,
            $skip: 3,
            $expand: 'baz',
            $filter: 'foo eq 1'
          };
          var queryParams = "?$expand=baz&$filter=foo eq 1&$orderby=foo&$select=foo,bar&$skip=3&$sort=bar&$top=2";
          $httpBackend.expectGET("/testApp/_api/web/lists/getByTitle('Test')/items" + queryParams, {
            accept: 'application/json;odata=verbose'
          });

          list.query(params);

          $httpBackend.flush();
        });

        it('returns an empty array with a $promise property', function() {
          var result = list.query();

          expect(result).to.have.property('$promise');

          $httpBackend.flush();
        });

        it('fills the empty array with the data return by the REST request when it resolves', function(done) {
          var result = list.query();
          result.$promise.then(function() {
            expect(result).to.have.lengthOf(3);
            done();
          });

          $httpBackend.flush();
        });
      });

      describe('#create(data)', function() {
        beforeEach(function() {
          $httpBackend.whenPOST(/\/testApp\/_api\/web\/lists\/getByTitle\('Test'\)\/items/, /.*/, {
            accept: 'application/json;odata=verbose',
            'X-RequestDigest': $spRequestDigest(),
            'Content-Type': 'application/json;odata=verbose'
          }).respond(JSON.stringify({
            d: {
              __metadata: {
                id: '95A2B4AC-7A2B-4EAC-ADAC-F8D2B828559A',
                uri: "https://TestDomain.sharepoint.com/sites/dev/TestApp/_api/Web/Lists('Test')/Items(2)",
                etag: "1"
              }
            }
          }));
        });
        afterEach(function() {
          $httpBackend.verifyNoOutstandingExpectation();
        });

        it('sets metadata type to the default item type set on the list', function() {
          var item = list.create();

          expect(item).to.have.deep.property('__metadata.type', 'SP.TestListItem');
        });

        it('throws an error when *type* is undefined and no default item type is set on the list', function() {
          list.defaults.itemType = undefined;

          expect(function() { list.create({}, undefined); }).to.throw(Error, /badargs/);
        });

        it('extends created item with *data*', function() {
          var item = list.create({foo: 'bar'});

          expect(item.foo).to.be.equal('bar');
        });

        it('adds $promise property to created item', function() {
          expect(list.create()).to.have.property('$promise');
        });

        it('extends the created object with the data return by the REST request when it resolves', function(done) {
          var data = {foo: 'bar'};
          $httpBackend.expectPOST("/testApp/_api/web/lists/getByTitle('Test')/items", angular.extend(data, {
            __metadata: { type: 'SP.Data.TestListItem' }
          }), {
            accept: 'application/json;odata=verbose',
            'X-RequestDigest': $spRequestDigest(),
            'Content-Type': 'application/json;odata=verbose'
          });

          var item = list.create(data);

          item.$promise.then(function() {
            expect(item.__metadata).to.be.eql({
              id: '95A2B4AC-7A2B-4EAC-ADAC-F8D2B828559A',
              uri: "https://TestDomain.sharepoint.com/sites/dev/TestApp/_api/Web/Lists('Test')/Items(2)",
              etag: "1"
            });
            done();
          });

          $httpBackend.flush();
          $httpBackend.verifyNoOutstandingRequest();
        });
      });
    });
  });
});
