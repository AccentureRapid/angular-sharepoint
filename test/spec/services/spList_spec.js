describe('ExpertsInside.SharePoint', function() {
  describe('Service: $spList(name, options)', function() {
    var $spList,
        $spRest,
        $httpBackend,
        TestItem,
        requestDigest,
        apiRootUrl;

    beforeEach(module('ExpertsInside.SharePoint'));
    beforeEach(inject(function(_$spList_, _$spRest_, _$httpBackend_) {
      $spList = _$spList_;
      $spRest = _$spRest_;
      $httpBackend = _$httpBackend_;

      TestItem = $spList('Test');

      sinon.stub(ShareCoffee.Commons, 'getFormDigest').returns(requestDigest = 'requestDigest');
      sinon.stub(ShareCoffee.Commons, 'getApiRootUrl')
        .returns(apiRootUrl = 'https://test.sharepoint.com/sites/test/app/_api/');
    }));
    afterEach(function() {
      ShareCoffee.Commons.getFormDigest.restore();
      ShareCoffee.Commons.getApiRootUrl.restore();
    });

    it('creates a ListItem class that acts like a ActiveRecord', function() {
      expect(TestItem).to.be.a('function');
      expect(TestItem.get).to.be.a('function');
      expect(TestItem.query).to.be.a('function');
      expect(TestItem.create).to.be.a('function');
      expect(TestItem.update).to.be.a('function');
      expect(TestItem.save).to.be.a('function');
      expect(TestItem.delete).to.be.a('function');
    });

    it('.$$listName is the List name', function() {
      expect(TestItem).to.have.property('$$listName', 'Test');
    });

    it('.$$listRelativeUrl is the relative List url', function() {
      expect(TestItem).to.have.property('$$listRelativeUrl', "web/lists/getByTitle('Test')");
    });

    describe('.$decorateResult(result, httpConfig)', function() {
      var httpConfig;

      beforeEach(function() {
        httpConfig = {
          url: apiRootUrl + TestItem.$$listRelativeUrl,
          method: 'GET'
        };
      });

      it('creates a ListItem from *result* unless it is already one', function() {
        var testItem = new TestItem();

        expect(TestItem.$decorateResult(testItem, httpConfig)).to.be.equal(testItem);
        expect(TestItem.$decorateResult({}, httpConfig)).to.be.instanceOf(TestItem);
      });

      it('adds $resolved property to the *result* unless it does already have one', function() {
        expect(TestItem.$decorateResult({}, httpConfig))
          .to.have.property('$resolved', false);
        expect(TestItem.$decorateResult({$resolved: true}, httpConfig))
          .to.have.property('$resolved', true);
      });

      it('adds $promise property to the *result*', function() {
        expect(TestItem.$decorateResult({}, httpConfig)).to.have.property('$promise');
      });

      describe('when the result.$promise resolves', function() {
        it('sets result.$resolved to true', function(done) {
          var result = TestItem.$decorateResult({foo: 1}, httpConfig);
          $httpBackend.expectGET(httpConfig.url).respond({});

          result.$promise.then(function() {
            expect(result.$resolved).to.be.true;
            done();
          });

          $httpBackend.flush();
        });

        it('merges result object with response object', function(done) {
          var result = TestItem.$decorateResult({foo: 1}, httpConfig);
          $httpBackend.expectGET(httpConfig.url).respond({bar: 2});

          result.$promise.then(function() {
            expect(result).to.have.property('bar', 2);
            done();
          });

          $httpBackend.flush();
        });

        it('merges result object with single item in array response', function(done) {
          var result = TestItem.$decorateResult({foo: 1}, httpConfig);
          $httpBackend.expectGET(httpConfig.url).respond([{bar: 2}]);

          result.$promise.then(function() {
            expect(result).to.have.property('bar', 2);
            done();
          });

          $httpBackend.flush();
        });

        it('merges result array with response array by creating a ListItem for each item', function(done) {
          var result = TestItem.$decorateResult([], httpConfig);
          $httpBackend.expectGET(httpConfig.url).respond([{bar: 2}, {bar: 3}]);

          result.$promise.then(function() {
            expect(result).to.have.lengthOf(2);
            expect(result[0]).to.be.instanceOf(TestItem);
            done();
          });

          $httpBackend.flush();
        });

        it('throws when trying to merge result object with response array (length > 1)', function() {
          var result = TestItem.$decorateResult({foo: 1}, httpConfig);
          $httpBackend.expectGET(httpConfig.url).respond([{bar: 2}, {bar: 3}]);

          expect(function() { $httpBackend.flush(); }).to.throw(Error, '[$spList:badresponse]');
        });
      });
    });

    describe('the created TestItem class', function() {
      it('#$settings has some sane defaults', function() {
        var testItem = new TestItem();

        expect(testItem.$settings).to.be.eql({
          itemType: 'SP.Data.TestListItem',
          readOnlyFields: ['Author', 'Editor', 'Created', 'Modified']
        });
      });

      it('#$save(options) delegates to ListItem.save and returns the promise', function() {
        var testItem = new TestItem();
        var promise = {};
        var options = {};
        sinon.stub(TestItem, 'save').returns({$promise: promise});

        expect(testItem.$save(options)).to.be.equal(promise);
        expect(TestItem.save).to.have.been.calledWith(testItem, options);

        TestItem.save.restore();
      });

      it('#$delete() delegates to ListItem.delete and returns the promise', function() {
        var testItem = new TestItem();
        var promise = {};
        sinon.stub(TestItem, 'delete').returns({$promise: promise});

        expect(testItem.$delete()).to.be.equal(promise);
        expect(TestItem.delete).to.have.been.calledWith(testItem);

        TestItem.delete.restore();
      });

      describe('.get(id, query)', function() {
        it('throws when id is not given', function() {
          expect(function() { TestItem.get(); }).to.throw(Error, ['$spList:badargs']);
          expect(function() { TestItem.get(null); }).to.throw(Error, ['$spList:badargs']);
        });

        it('creates a valid get request and returns the result', function() {
          sinon.spy($spRest, 'buildHttpConfig');
          sinon.spy(TestItem, '$decorateResult');

          var query = { select: ['Id', 'Title'] };
          var testItem = TestItem.get(1, query);

          expect($spRest.buildHttpConfig).to.have.been.calledWith(
            TestItem.$$listRelativeUrl,
            'get', {
              id: 1,
              query: query
            });
          expect(TestItem.$decorateResult).to.have.been.calledWith(
            { Id: 1 },
            $spRest.buildHttpConfig.firstCall.returnValue
          );
          expect(testItem).to.be.equal(TestItem.$decorateResult.firstCall.returnValue);

          $spRest.buildHttpConfig.restore();
          TestItem.$decorateResult.restore();
        });
      });

      describe('.query(query, options)', function() {
        it('creates a valid query request and returns the result', function() {
          sinon.spy($spRest, 'buildHttpConfig');
          sinon.spy(TestItem, '$decorateResult');
          var query = { select: ['Id', 'Title'] };

          var testItems = TestItem.query(query);

          expect($spRest.buildHttpConfig).to.have.been.calledWith(
            TestItem.$$listRelativeUrl,
            'query', {
              query: query
            });
          expect(TestItem.$decorateResult).to.have.been.calledWithMatch(
            { },
            $spRest.buildHttpConfig.firstCall.returnValue
          );
          expect(testItems).to.be.equal(TestItem.$decorateResult.firstCall.returnValue);

          $spRest.buildHttpConfig.restore();
          TestItem.$decorateResult.restore();
        });

        it('returns a single object as result when options.singleResult is true', function() {
          var query = { select: ['Id', 'Title'] };

          var testItem = TestItem.query(query, { singleResult: true });

          expect(testItem).to.be.instanceOf(Object).and.not.be.instanceOf(Array);
        });
      });

      describe('.create(item, query)', function() {
        it('throws when item is not a ListItem', function() {
          expect(function() { TestItem.create({}); }).to.throw(Error, ['$spList:badargs']);
        });
        it('throws when item does not have a valid type', function() {
          var testItem = new TestItem();
          delete testItem.$settings.itemType;
          expect(function() { TestItem.create(testItem); }).to.throw(Error, ['$spList:badargs']);
        });

        it('creates a valid create request and returns the result', function() {
          sinon.spy($spRest, 'buildHttpConfig');
          sinon.spy(TestItem, '$decorateResult');
          var testItem = new TestItem({foo: 'bar'});
          var query = { select: ['Id', 'Title'] };

          var result = TestItem.create(testItem, query);

          expect(testItem.__metadata.type).to.be.equal(testItem.$settings.itemType);
          expect($spRest.buildHttpConfig).to.have.been.calledWith(
            TestItem.$$listRelativeUrl,
            'create', {
              item: testItem,
              query: query
            });
          expect(TestItem.$decorateResult).to.have.been.calledWith(
            testItem,
            $spRest.buildHttpConfig.firstCall.returnValue
          );
          expect(result).to.be.equal(TestItem.$decorateResult.firstCall.returnValue);

          $spRest.buildHttpConfig.restore();
          TestItem.$decorateResult.restore();
        });
      });

      describe('.update(item, options)', function() {
        it('throws when item is not a ListItem', function() {
          expect(function() { TestItem.create({}); }).to.throw(Error, ['$spList:badargs']);
        });

        it('creates a valid update request and returns the result', function() {
          sinon.spy($spRest, 'buildHttpConfig');
          sinon.spy(TestItem, '$decorateResult');
          var testItem = new TestItem({
            Id: 1,
            foo: 'bar',
            __metadata: {
              uri: apiRootUrl + TestItem.$$listRelativeUrl + '/items(1)'
            }
          });
          var options = { force: true };
          var result = TestItem.update(testItem, options);

          expect($spRest.buildHttpConfig).to.have.been.calledWith(
            TestItem.$$listRelativeUrl,
            'update', {
              item: testItem,
              force: true
            });
          expect(TestItem.$decorateResult).to.have.been.calledWith(
            testItem,
            $spRest.buildHttpConfig.firstCall.returnValue
          );
          expect(result).to.be.equal(TestItem.$decorateResult.firstCall.returnValue);

          $spRest.buildHttpConfig.restore();
          TestItem.$decorateResult.restore();
        });
      });

      describe('.save(item, options)', function() {
        beforeEach(function() {
          sinon.stub(TestItem, 'create');
          sinon.stub(TestItem, 'update');
        });
        afterEach(function() {
          TestItem.create.restore();
          TestItem.update.restore();
        });

        it('delgates to .create for new items', function() {
          var options = { query: { select: ['Id', 'Title'] } };
          var item = new TestItem();

          TestItem.save(item, options);

          expect(TestItem.create).to.have.been.calledWith(item, options.query);
        });

        it('delgates to .update for loaded items', function() {
          var options = { force: true };
          var item = new TestItem({
            __metadata: { id: '1' }
          });

          TestItem.save(item, options);

          expect(TestItem.update).to.have.been.calledWith(item, options);
        });
      });

      describe('.delete(item)', function() {
        it('throws when item is not a ListItem', function() {
          expect(function() { TestItem.create({}); }).to.throw(Error, ['$spList:badargs']);
        });

        it('creates a valid delete request and returns the result', function() {
          sinon.spy($spRest, 'buildHttpConfig');
          sinon.spy(TestItem, '$decorateResult');
          var testItem = new TestItem({
            Id: 1,
            foo: 'bar',
            __metadata: {
              uri: apiRootUrl + TestItem.$$listRelativeUrl + '/items(1)'
            }
          });
          var result = TestItem.delete(testItem);

          expect($spRest.buildHttpConfig).to.have.been.calledWith(
            TestItem.$$listRelativeUrl,
            'delete', {
              item: testItem
            });
          expect(TestItem.$decorateResult).to.have.been.calledWith(
            testItem,
            $spRest.buildHttpConfig.firstCall.returnValue
          );
          expect(result).to.be.equal(TestItem.$decorateResult.firstCall.returnValue);

          $spRest.buildHttpConfig.restore();
          TestItem.$decorateResult.restore();
        });
      });
    });
  });
});
//
//     it('is defined', function() {
//       expect($spList).not.to.be.undefined;
//     });
//
//     it('is a factory function for list objects', function() {
//       expect($spList).to.be.a('function');
//       expect($spList('Test')).to.be.instanceOf($spList.List);
//     });
//
//     it('throws when no *name* is given', function() {
//       expect(function() { $spList(); }).to.throw(Error, '[$spList:badargs] name cannot be blank.');
//     });
//
//     it('defaults *settings* to an object with a single itemType property that gets infered from the list name', function() {
//       var list = $spList('test');
//
//       expect(list.settings).to.be.eql({
//         itemType: 'SP.Data.TestListItem',
//         readOnlyFields: [
//           'Author', 'Editor', 'Created', 'Modified'
//         ]
//       });
//     });
//
//     describe('List', function() {
//       var list;
//
//       beforeEach(function() {
//         list = $spList('Test', {
//           itemType: 'SP.Data.TestListItem'
//         });
//       });
//
//       describe('.ctor(name, options)', function() {
//         it('sets the *name* on the list', function() {
//           expect($spList('test')).to.have.property('name', 'test');
//         });
//
//         it('creates some default settings when *options* is empty', function() {
//           var list = $spList('test');
//
//           expect(list.settings).to.be.eql({
//             itemType: 'SP.Data.TestListItem',
//             readOnlyFields: [ 'Author', 'Editor', 'Created', 'Modified' ]
//           });
//         });
//
//         it('extends readOnlyFields with option', function() {
//           var list = $spList('test', {
//             readOnlyFields: ['Foo', 'Bar']
//           });
//
//           expect(list.settings.readOnlyFields).to.contain('Foo').and.to.contain('Bar');
//         });
//       });
//
//       it('#$baseUrl()', function() {
//         expect(list.$baseUrl()).to.be.equal("web/lists/getByTitle('Test')");
//       });
//
//       describe('#$createPayload(data)', function() {
//         it('removes read-only fields from *data*', function() {
//           var list = $spList('test', {
//             readOnlyFields: ['Foo', 'Bar']
//           });
//
//           var payload = list.$createPayload({
//             Foo: 1,
//             Bar: 2,
//             Baz: 3
//           });
//           expect(payload).to.be.eql({
//             Baz: 3
//           });
//         });
//
//         it('does not modify the input *data*', function() {
//           var list = $spList('test', {
//             readOnlyFields: ['Foo']
//           });
//           var data = { Foo: 1 };
//
//           list.$createPayload(data);
//
//           expect(data).to.be.eql({Foo: 1});
//         });
//       });
//
//       describe('#get(id, params)', function() {
//         beforeEach(function() {
//           $httpBackend.whenGET(/\/testApp\/_api\/web\/lists\/getByTitle\('Test'\)\/items\(1\)/, {
//             Accept: 'application/json;odata=verbose'
//           }).respond(JSON.stringify({
//             d: {
//               Id: 1
//             }
//           }));
//         });
//         afterEach(function() {
//           $httpBackend.verifyNoOutstandingExpectation();
//           $httpBackend.verifyNoOutstandingRequest();
//         });
//
//         it('creates REST call that fetches the item with the given *id*', function() {
//           $httpBackend.expectGET("/testApp/_api/web/lists/getByTitle('Test')/items(1)", {
//             Accept: 'application/json;odata=verbose'
//           });
//
//           list.get(1);
//
//           $httpBackend.flush();
//         });
//
//         it('creates REST with query *params* that fetches the item with the given *id*', function() {
//           $httpBackend.expectGET("/testApp/_api/web/lists/getByTitle('Test')/items(1)?$select=foo", {
//             Accept: 'application/json;odata=verbose'
//           });
//
//           list.get(1, {
//             select: 'foo',
//           });
//
//           $httpBackend.flush();
//         });
//
//         it('returns an object with an Id, $promise and $resolved property', function() {
//           var item = list.get(1);
//
//           expect(item).to.have.property('$promise');
//           expect(item).to.have.property('$resolved', false);
//           expect(item).to.have.property('Id', 1);
//
//           $httpBackend.flush();
//         });
//
//         it('extends the returned object with the data from the REST response when it resolves', function(done) {
//           var item = list.get(1);
//
//           item.$promise.then(function() {
//             expect(item.Id).to.be.equal(1);
//             expect(item.$resolved).to.be.equal(true);
//             done();
//           });
//
//           $httpBackend.flush();
//         });
//
//         it('throws error when *id* is undefined', function() {
//           expect(function() {
//             list.get();
//           }).to.throw(Error, '[$spList:badargs] id is required.');
//         });
//       });
//
//       describe('#query(id, params)', function() {
//         beforeEach(function() {
//           $httpBackend.whenGET(/\/testApp\/_api\/web\/lists\/getByTitle\('Test'\)\/items/, {
//             Accept: 'application/json;odata=verbose'
//           }).respond(JSON.stringify({
//             d: {
//               results: [
//                 {Id: 1},
//                 {Id: 2},
//                 {Id: 3}
//               ]
//             }
//           }));
//         });
//         afterEach(function() {
//           $httpBackend.verifyNoOutstandingExpectation();
//           $httpBackend.verifyNoOutstandingRequest();
//         });
//
//         it('creates REST call that fetches all items', function() {
//           $httpBackend.expectGET("/testApp/_api/web/lists/getByTitle('Test')/items", {
//             Accept: 'application/json;odata=verbose'
//           });
//
//           list.query();
//
//           $httpBackend.flush();
//         });
//
//         it('creates REST with query *params* that queries the list for the items', function() {
//           var params = {
//             $select: ['foo','bar'],
//             $orderby: 'foo',
//             $sort: 'bar',
//             $top: 2,
//             $skip: 3,
//             $expand: 'baz',
//             $filter: 'foo eq 1'
//           };
//           var queryParams = "?$expand=baz&$filter=foo eq 1&$orderby=foo&$select=foo,bar&$skip=3&$sort=bar&$top=2";
//           $httpBackend.expectGET("/testApp/_api/web/lists/getByTitle('Test')/items" + queryParams, {
//             Accept: 'application/json;odata=verbose'
//           });
//
//           list.query(params);
//
//           $httpBackend.flush();
//         });
//
//         it('returns an empty array with a $promise property', function() {
//           var result = list.query();
//
//           expect(result).to.have.property('$promise');
//
//           $httpBackend.flush();
//         });
//
//         it('fills the empty array with the data return by the REST request when it resolves', function(done) {
//           var result = list.query();
//           result.$promise.then(function() {
//             expect(result).to.have.lengthOf(3);
//             done();
//           });
//
//           $httpBackend.flush();
//         });
//       });
//
//       describe('#create(data)', function() {
//         beforeEach(function() {
//           $httpBackend.whenPOST(/\/testApp\/_api\/web\/lists\/getByTitle\('Test'\)\/items/, /.*/, {
//             Accept: 'application/json;odata=verbose',
//             'X-RequestDigest': requestDigest,
//             'Content-Type': 'application/json;odata=verbose'
//           }).respond(JSON.stringify({
//             d: {
//               __metadata: {
//                 id: '95A2B4AC-7A2B-4EAC-ADAC-F8D2B828559A',
//                 uri: "https://TestDomain.sharepoint.com/sites/dev/TestApp/_api/Web/Lists('Test')/Items(2)",
//                 etag: "1"
//               }
//             }
//           }));
//         });
//         afterEach(function() {
//           $httpBackend.verifyNoOutstandingExpectation();
//         });
//
//         it('sets metadata type to the default item type set on the list', function() {
//           var item = list.create();
//
//           expect(item).to.have.deep.property('__metadata.type', 'SP.Data.TestListItem');
//         });
//
//         it('throws an error when *type* is undefined and no default item type is set on the list', function() {
//           list.settings.itemType = undefined;
//
//           expect(function() { list.create({}); }).to.throw(Error, /badargs/);
//         });
//
//         it('extends created item with *data*', function() {
//           var item = list.create({foo: 'bar'});
//
//           expect(item.foo).to.be.equal('bar');
//         });
//
//         it('adds $promise property to created item', function() {
//           expect(list.create()).to.have.property('$promise');
//         });
//
//         it('extends the created object with the data return by the REST request when it resolves', function(done) {
//           var data = {foo: 'bar'};
//           $httpBackend.expectPOST("/testApp/_api/web/lists/getByTitle('Test')/items", angular.extend(data, {
//             __metadata: { type: 'SP.Data.TestListItem' }
//           }), {
//             Accept: 'application/json;odata=verbose',
//             'X-RequestDigest': requestDigest,
//             'Content-Type': 'application/json;odata=verbose'
//           });
//
//           var item = list.create(data);
//
//           item.$promise.then(function() {
//             expect(item.__metadata).to.be.eql({
//               id: '95A2B4AC-7A2B-4EAC-ADAC-F8D2B828559A',
//               uri: "https://TestDomain.sharepoint.com/sites/dev/TestApp/_api/Web/Lists('Test')/Items(2)",
//               etag: "1"
//             });
//             done();
//           });
//
//           $httpBackend.flush();
//           $httpBackend.verifyNoOutstandingRequest();
//         });
//       });
//
//       describe('#save(item, options)', function() {
//         beforeEach(function() {
//           sinon.stub(list, 'create');
//           sinon.stub(list, 'update');
//         });
//         afterEach(function() {
//           list.create.restore();
//         });
//
//         it('delgates to #create for new items', function() {
//           var item = {};
//
//           list.save(item);
//
//           expect(list.create).to.have.been.calledWith(item);
//         });
//
//         it('delgates to #update for loaded items', function() {
//           var item = {Id: 1};
//           var options = {force: true};
//
//           list.save(item, options);
//
//           expect(list.update).to.have.been.calledWith(item, options);
//         });
//       });
//
//       describe('#update(item, options)', function() {
//         afterEach(function() {
//           $httpBackend.verifyNoOutstandingExpectation();
//         });
//
//         it('throws an error when *item* does not have a __metadata property', function() {
//           expect(function() { list.update({}); }).to.throw(Error, /badargs/);
//         });
//
//         it('creates a valid SharePoint REST API request', function() {
//           var item = {
//             Id: 2,
//             __metadata: {
//               id: '95A2B4AC-7A2B-4EAC-ADAC-F8D2B828559A',
//               uri: "https://TestDomain.sharepoint.com/sites/dev/TestApp/_api/Web/Lists('Test')/Items(2)",
//               etag: "1"
//             }
//           };
//           $httpBackend.expectPOST(item.__metadata.uri, /.*/, {
//             'Accept': 'application/json;odata=verbose',
//             'X-RequestDigest': requestDigest,
//             'Content-Type': 'application/json;odata=verbose',
//             'X-HTTP-Method' : 'MERGE',
//             'If-Match' : item.__metadata.etag
//           }).respond({});
//
//           var result = list.update(item);
//
//           $httpBackend.flush();
//           $httpBackend.verifyNoOutstandingRequest();
//         });
//
//         it('does not include an etag in the request when *options*.force is true', function() {
//           var item = {
//             Id: 2,
//             __metadata: {
//               uri: "https://TestDomain.sharepoint.com/sites/dev/TestApp/_api/Web/Lists('Test')/Items(2)",
//               etag: '1'
//             }
//           };
//           $httpBackend.expectPOST(item.__metadata.uri, /.*/, function(headers) {
//             return headers['If-Match'] === '*';
//           }).respond({});
//
//           var result = list.update(item, {force: true});
//
//           $httpBackend.flush();
//           $httpBackend.verifyNoOutstandingRequest();
//         });
//       });
//
//       describe('#delete(item)', function() {
//         afterEach(function() {
//           $httpBackend.verifyNoOutstandingExpectation();
//         });
//
//         it('throws an error when *item* does not have a __metadata property', function() {
//           expect(function() { list.delete({}); }).to.throw(Error, /badargs/);
//         });
//
//         it('creates a valid SharePoint REST API request', function() {
//           var item = {
//             Id: 2,
//             __metadata: {
//               id: '95A2B4AC-7A2B-4EAC-ADAC-F8D2B828559A',
//               uri: "https://TestDomain.sharepoint.com/sites/dev/TestApp/_api/Web/Lists('Test')/Items(2)",
//               etag: "1"
//             }
//           };
//           $httpBackend.expectDELETE(item.__metadata.uri, {
//             'Accept': 'application/json;odata=verbose',
//             'X-RequestDigest': requestDigest,
//             'If-Match' : '*'
//           }).respond({});
//
//           var result = list.delete(item);
//
//           $httpBackend.flush();
//           $httpBackend.verifyNoOutstandingRequest();
