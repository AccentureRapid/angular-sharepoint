describe('ExpertsInside.SharePoint', function() {
  describe('Service: $spList(name, options)', function() {
    var $spPageContextInfo,
        $spList,
        $spRequestDigest,
        $httpBackend,
        requestDigest,
        appWebUrl;

    beforeEach(module('ExpertsInside.SharePoint'));
    beforeEach(inject(function(_$spList_, _$spPageContextInfo_, _$httpBackend_) {
      $spList = _$spList_;
      $spPageContextInfo = _$spPageContextInfo_;
      $httpBackend = _$httpBackend_;

      sinon.stub(ShareCoffee.Commons, 'getFormDigest').returns(requestDigest = 'requestDigest');
      sinon.stub(ShareCoffee.Commons, 'getAppWebUrl').returns(appWebUrl = '/testApp');
    }));
    afterEach(function() {
      ShareCoffee.Commons.getFormDigest.restore();
      ShareCoffee.Commons.getAppWebUrl.restore();
    });

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

    it('defaults *settings* to an object with a single itemType property that gets infered from the list name', function() {
      var list = $spList('test');

      expect(list.settings).to.be.eql({
        itemType: 'SP.Data.TestListItem',
        readOnlyFields: [
          'Author', 'Editor', 'Created', 'Modified'
        ]
      });
    });

    describe('List', function() {
      var list;

      beforeEach(function() {
        list = $spList('Test', {
          itemType: 'SP.Data.TestListItem'
        });
      });

      describe('.ctor(name, options)', function() {
        it('sets the *name* on the list', function() {
          expect($spList('test')).to.have.property('name', 'test');
        });

        it('creates some default settings when *options* is empty', function() {
          var list = $spList('test');

          expect(list.settings).to.be.eql({
            itemType: 'SP.Data.TestListItem',
            readOnlyFields: [ 'Author', 'Editor', 'Created', 'Modified' ]
          });
        });

        it('extends readOnlyFields with option', function() {
          var list = $spList('test', {
            readOnlyFields: ['Foo', 'Bar']
          });

          expect(list.settings.readOnlyFields).to.contain('Foo').and.to.contain('Bar');
        });
      });

      it('#$baseUrl()', function() {
        expect(list.$baseUrl()).to.be.equal("web/lists/getByTitle('Test')");
      });

      describe('#$createPayload(data)', function() {
        it('removes read-only fields from *data*', function() {
          var list = $spList('test', {
            readOnlyFields: ['Foo', 'Bar']
          });

          var payload = list.$createPayload({
            Foo: 1,
            Bar: 2,
            Baz: 3
          });
          expect(payload).to.be.eql({
            Baz: 3
          });
        });

        it('does not modify the input *data*', function() {
          var list = $spList('test', {
            readOnlyFields: ['Foo']
          });
          var data = { Foo: 1 };

          list.$createPayload(data);

          expect(data).to.be.eql({Foo: 1});
        });
      });

      describe('#get(id, params)', function() {
        beforeEach(function() {
          $httpBackend.whenGET(/\/testApp\/_api\/web\/lists\/getByTitle\('Test'\)\/items\(1\)/, {
            Accept: 'application/json;odata=verbose'
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
            Accept: 'application/json;odata=verbose'
          });

          list.get(1);

          $httpBackend.flush();
        });

        it('creates REST with query *params* that fetches the item with the given *id*', function() {
          $httpBackend.expectGET("/testApp/_api/web/lists/getByTitle('Test')/items(1)?$select=foo", {
            Accept: 'application/json;odata=verbose'
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

      describe('#query(id, params)', function() {
        beforeEach(function() {
          $httpBackend.whenGET(/\/testApp\/_api\/web\/lists\/getByTitle\('Test'\)\/items/, {
            Accept: 'application/json;odata=verbose'
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
            Accept: 'application/json;odata=verbose'
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
            Accept: 'application/json;odata=verbose'
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
            Accept: 'application/json;odata=verbose',
            'X-RequestDigest': requestDigest,
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

          expect(item).to.have.deep.property('__metadata.type', 'SP.Data.TestListItem');
        });

        it('throws an error when *type* is undefined and no default item type is set on the list', function() {
          list.settings.itemType = undefined;

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
            Accept: 'application/json;odata=verbose',
            'X-RequestDigest': requestDigest,
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

      describe('#save(item)', function() {
        beforeEach(function() {
          sinon.stub(list, 'create');
          sinon.stub(list, 'update');
        });
        afterEach(function() {
          list.create.restore();
          list.update.restore();
        });

        it('delgates to #create for new items', function() {
          var item = {};

          list.save(item);

          expect(list.create).to.have.been.calledWith(item);
        });

        it('delgates to #update for laoded items', function() {
          var item = {Id: 1};

          list.save(item);

          expect(list.update).to.have.been.calledWith(item);
        });
      });
    });
  });
});
