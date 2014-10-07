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

    it('.$$relativeUrl is the relative List url', function() {
      expect(TestItem).to.have.property('$$relativeUrl', "web/lists/getByTitle('Test')");
    });

    describe('.$$decorateResult(result, httpConfig)', function() {
      var httpConfig;

      beforeEach(function() {
        httpConfig = {
          url: apiRootUrl + TestItem.$$relativeUrl,
          method: 'GET'
        };
      });

      it('creates a ListItem from *result* unless it is already one', function() {
        var testItem = new TestItem();

        expect(TestItem.$$decorateResult(testItem, httpConfig)).to.be.equal(testItem);
        expect(TestItem.$$decorateResult({}, httpConfig)).to.be.instanceOf(TestItem);
      });

      it('adds $resolved property to the *result* unless it does already have one', function() {
        expect(TestItem.$$decorateResult({}, httpConfig))
          .to.have.property('$resolved', false);
        expect(TestItem.$$decorateResult({$resolved: true}, httpConfig))
          .to.have.property('$resolved', true);
      });

      it('adds $promise property to the *result*', function() {
        expect(TestItem.$$decorateResult({}, httpConfig)).to.have.property('$promise');
      });

      describe('when the result.$promise resolves', function() {
        it('sets result.$resolved to true', function(done) {
          var result = TestItem.$$decorateResult({foo: 1}, httpConfig);
          $httpBackend.expectGET(httpConfig.url).respond({});

          result.$promise.then(function() {
            expect(result.$resolved).to.be.true;
            done();
          });

          $httpBackend.flush();
        });

        it('merges result object with response object', function(done) {
          var result = TestItem.$$decorateResult({foo: 1}, httpConfig);
          $httpBackend.expectGET(httpConfig.url).respond({bar: 2});

          result.$promise.then(function() {
            expect(result).to.have.property('bar', 2);
            done();
          });

          $httpBackend.flush();
        });

        it('merges result object with single item in array response', function(done) {
          var result = TestItem.$$decorateResult({foo: 1}, httpConfig);
          $httpBackend.expectGET(httpConfig.url).respond([{bar: 2}]);

          result.$promise.then(function() {
            expect(result).to.have.property('bar', 2);
            done();
          });

          $httpBackend.flush();
        });

        it('merges result array with response array by creating a ListItem for each item', function(done) {
          var result = TestItem.$$decorateResult([], httpConfig);
          $httpBackend.expectGET(httpConfig.url).respond([{bar: 2}, {bar: 3}]);

          result.$promise.then(function() {
            expect(result).to.have.lengthOf(2);
            expect(result[0]).to.be.instanceOf(TestItem);
            done();
          });

          $httpBackend.flush();
        });

        it('throws when trying to merge result object with response array (length > 1)', function() {
          var result = TestItem.$$decorateResult({foo: 1}, httpConfig);
          $httpBackend.expectGET(httpConfig.url).respond([{bar: 2}, {bar: 3}]);

          expect(function() { $httpBackend.flush(); }).to.throw(Error, '[$spList:badresponse]');
        });

        it('updates the etag of the result on updates', function(done) {
          var result = TestItem.$$decorateResult({foo: 1, __metadata: { etag: '1'}}, httpConfig);
          $httpBackend.expectGET(httpConfig.url).respond(204, null, { ETag: '2' });

          result.$promise.then(function() {
            expect(result.__metadata.etag).to.be.equal('2');
            done();
          });

          $httpBackend.flush();
        });
      });
    });

    describe('.buildHttpConfig(action, options)', function() {
      it('sets transformResponse on the httpConfig', function() {
        expect(TestItem.$$buildHttpConfig().transformResponse).to.be.equal($spRest.transformResponse);
      });

      it('creates a query string from *options*.query and adds it to the url', function() {
        var httpConfig = TestItem.$$buildHttpConfig('query', {query: {select: ['Id', 'Title']}});

        expect(httpConfig.url).to.be.contain(TestItem.$$relativeUrl + '/items?$select=Id,Title');
      });

      it('when *options*.inHostWeb is true, adds default host web url as @target parameter', function() {
        TestItem.$$inHostWeb = true;
        sinon.stub(ShareCoffee.Commons, 'getHostWebUrl').returns('http://host.web');

        var httpConfig = TestItem.$$buildHttpConfig('query');

        expect(httpConfig.url).to.contain('@target=\'http://host.web\'');

        ShareCoffee.Commons.getHostWebUrl.restore();
      });

      it('when *options*.inHostWeb is a String, adds the given url  as @target parameter', function() {
        TestItem.$$inHostWeb = 'http://custom.host.web';

        var httpConfig = TestItem.$$buildHttpConfig('query');

        expect(httpConfig.url).to.contain('@target=\'http://custom.host.web\'');
      });

      describe('when *action* is "get"', function() {
        it('sets httpConfig.url to the url of the item', function() {
          var httpConfig = TestItem.$$buildHttpConfig('get', {id: 1});

          expect(httpConfig.url).to.be.equal(apiRootUrl + TestItem.$$relativeUrl + '/items(1)');
        });

        it('throws when *options*.id is not set', function() {
          expect(function() { TestItem.$$buildHttpConfig('get'); }).to.throw(Error, '[$spList:options:get]');
        });

        it('sets correct httpConfig.headers', function() {
          var httpConfig = TestItem.$$buildHttpConfig('get', {id: 1});

          expect(httpConfig.headers).to.be.eql({
            'Accept': 'application/json;odata=verbose'
          });
        });
      });

      describe('when *action* is "query"', function() {
        it('sets httpConfig.url to the items root url', function() {
          var httpConfig = TestItem.$$buildHttpConfig('query');

          expect(httpConfig.url).to.be.equal(apiRootUrl + TestItem.$$relativeUrl + '/items');
        });

        it('sets correct httpConfig.headers', function() {
          var httpConfig = TestItem.$$buildHttpConfig('query');

          expect(httpConfig.headers).to.be.eql({
            'Accept': 'application/json;odata=verbose'
          });
        });
      });

      describe('when *action* is "create"', function() {
        it('throws when *options*.item is not set', function() {
          expect(function() { TestItem.$$buildHttpConfig('create'); }).to.throw(Error, '[$spList:options:create]');
        });

        it('sets httpConfig.url to the items root url', function() {
          var httpConfig = TestItem.$$buildHttpConfig('create', {item: new TestItem()});

          expect(httpConfig.url).to.be.equal(apiRootUrl + TestItem.$$relativeUrl + '/items');
        });

        it('sets httpConfig.data to the stringified item', function() {
          var options = {item: new TestItem({foo: 1})};
          var httpConfig = TestItem.$$buildHttpConfig('create', options);

          expect(httpConfig.data).to.be.equal('{"__metadata":{"type":"SP.Data.TestListItem"},"foo":1}');
        });

        it('sets correct httpConfig.headers', function() {
          var httpConfig = TestItem.$$buildHttpConfig('create', {item: new TestItem()});

          expect(httpConfig.headers).to.be.eql({
            'Accept': 'application/json;odata=verbose',
            'Content-Type': 'application/json;odata=verbose',
            'X-RequestDigest': requestDigest
          });
        });

        it('removes $expand from query properties', function() {
          var httpConfig = TestItem.$$buildHttpConfig('create', {query: { $expand: 'Foo/Id' }, item: new TestItem()});

          expect(httpConfig.url).to.not.contain('$expand');
        });
      });

      describe('when *action* is "update"', function() {
        var item;

        beforeEach(function() {
          item = new TestItem({
            Id: 1,
            __metadata: {
              type: 'SP.Data.TestListItem',
              etag: '1',
              uri: apiRootUrl + TestItem.$$relativeUrl + '/items(1)'
            }
          });
        });

        it('throws when *options*.item is not set', function() {
          expect(function() { TestItem.$$buildHttpConfig('update'); })
            .to.throw(Error, '[$spList:options:update]');
        });
        // TODO
        // it('throws when *options*.item is not a valid list item', function() {
        //   expect(function() { TestItem.$$buildHttpConfig('update', {item: {}}); })
        //     .to.throw(Error, '[$spList:options:update]');
        // });

        it('sets correct httpConfig.headers', function() {
          var httpConfig = TestItem.$$buildHttpConfig('update', {item: item});

          expect(httpConfig.headers).to.be.eql({
            'Accept': 'application/json;odata=verbose',
            'Content-Type': 'application/json;odata=verbose',
            'X-RequestDigest': requestDigest,
            'If-Match': item.__metadata.etag,
            'X-HTTP-Method': 'MERGE'
          });
        });

        it('sets the "If-Match" property in httpConfig.header to "*" when options.force is true', function() {
          var httpConfig = TestItem.$$buildHttpConfig('update', {item: item, force: true});

          expect(httpConfig.headers).to.have.property('If-Match', '*');
        });

        it('sets httpConfig.data to the stringified item', function() {
          var options = {item: item};
          var httpConfig = TestItem.$$buildHttpConfig('update', options);

          expect(httpConfig.data).to.be.equal(
            '{"__metadata":{"type":"SP.Data.TestListItem","etag":"1","uri":"https://test.sharepoint.com/sites/test/app/_api/web/lists/getByTitle(\'Test\')/items(1)"},"Id":1}'
          );
        });

        it('sets httpConfig.url to the url of the item', function() {
          var options = {item: item};
          var httpConfig = TestItem.$$buildHttpConfig('update', options);

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
              uri: apiRootUrl + TestItem.$$relativeUrl + '/items(1)'
            }
          };
        });

        it('throws when *options*.item is not set', function() {
          expect(function() { TestItem.$$buildHttpConfig('delete'); })
            .to.throw(Error, '[$spList:options:delete]');
        });
        it('throws when *options*.item.__metadata is not set', function() {
          expect(function() { TestItem.$$buildHttpConfig('delete', {item: {}}); })
            .to.throw(Error, '[$spList:options:delete]');
        });

        it('sets correct httpConfig.headers', function() {
          var httpConfig = TestItem.$$buildHttpConfig('delete', {item: item});

          expect(httpConfig.headers).to.be.eql({
            'Accept': 'application/json;odata=verbose',
            'Content-Type': 'application/json;odata=verbose',
            'X-RequestDigest': requestDigest,
            'If-Match': '*'
          });
        });

        it('sets httpConfig.url to the url of the item', function() {
          var options = {item: item};
          var httpConfig = TestItem.$$buildHttpConfig('delete', options);

          expect(httpConfig.url).to.be.equal(item.__metadata.uri);
        });
      });
    });

    it('creates some sane defaults for #$$readOnlyFields', function() {
      expect(TestItem.prototype.$$readOnlyFields).to.be.eql([
        'AttachmentFiles',
        'Attachments',
        'Author',
        'AuthorId',
        'ContentType',
        'ContentTypeId',
        'Created',
        'Editor',
        'EditorId', 'FieldValuesAsHtml',
        'FieldValuesAsText',
        'FieldValuesForEdit',
        'File',
        'FileSystemObjectType',
        'FirstUniqueAncestorSecurableObject',
        'Folder',
        'GUID',
        'Modified',
        'OData__UIVersionString',
        'ParentList',
        'RoleAssignments'
      ]);
    });

    it('extends the default read only fields with those passed as *options*', function() {
      TestItem = $spList('Test', {
        readOnlyFields: ['TestReadOnlyField']
      });

      expect(TestItem.prototype.$$readOnlyFields).to.contain('TestReadOnlyField')
        .and.have.length.above(1);
    });

    it('extends the default query defaults with those passed as *options*', function() {
      TestItem = $spList('Test', {
        query: {
          select: ['Id', 'Title']
        }
      });

      expect(TestItem.prototype.$$queryDefaults).to.be.eql({
        select: ['Id', 'Title']
      });
    });

    describe('the created TestItem class', function() {
      beforeEach(function() {
        TestItem = $spList('Test', {
          query: {
            select: ['Id', 'Title']
          }
        });
      });

      it('.ctor() adds __metadata property to created item', function() {
        var testItem = new TestItem();

        expect(testItem).to.have.deep.property('__metadata.type', 'SP.Data.TestListItem');
      });

      it('.ctor() extends created item with passed data', function() {
        var testItem = new TestItem({
          foo: 'bar',
          __metadata: { type: 'SP.Data.CustomListItem' }
        });

        expect(testItem).to.be.have.property('foo', 'bar');
        expect(testItem).to.be.have.deep.property('__metadata.type', 'SP.Data.CustomListItem');
      });

      it('.save(options) delegates to ListItem.save and returns the promise', function() {
        var testItem = new TestItem();
        var promise = {};
        var options = {};
        sinon.stub(TestItem, 'save').returns({$promise: promise});

        expect(testItem.$save(options)).to.be.equal(promise);
        expect(TestItem.save).to.have.been.calledWith(testItem, options);

        TestItem.save.restore();
      });

      it('.delete() delegates to ListItem.delete and returns the promise', function() {
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
          sinon.spy(TestItem, '$$buildHttpConfig');
          sinon.spy(TestItem, '$$decorateResult');

          var query = { select: ['Id', 'Title'] };
          var testItem = TestItem.get(1, query);

          expect(TestItem.$$buildHttpConfig).to.have.been.calledWith(
            'get', {
              id: 1,
              query: query
            });
          expect(TestItem.$$decorateResult).to.have.been.calledWith(
            { Id: 1 },
            TestItem.$$buildHttpConfig.firstCall.returnValue
          );
          expect(testItem).to.be.equal(TestItem.$$decorateResult.firstCall.returnValue);

          TestItem.$$buildHttpConfig.restore();
          TestItem.$$decorateResult.restore();
        });
      });

      describe('.query(query, options)', function() {
        it('creates a valid query request and returns the result', function() {
          sinon.spy(TestItem, '$$buildHttpConfig');
          sinon.spy(TestItem, '$$decorateResult');
          var query = { expand: ['Foo'] };

          var testItems = TestItem.query(query);

          expect(TestItem.$$buildHttpConfig).to.have.been.calledWith(
            'query', {
              query: {
                select: ['Id', 'Title'],
                expand: ['Foo']
              }
            });
          expect(TestItem.$$decorateResult).to.have.been.calledWithMatch(
            { },
            TestItem.$$buildHttpConfig.firstCall.returnValue
          );
          expect(testItems).to.be.equal(TestItem.$$decorateResult.firstCall.returnValue);

          TestItem.$$buildHttpConfig.restore();
          TestItem.$$decorateResult.restore();
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

        it('sets __metadata.type to default list item type when not already defined', function() {
          var testItem = new TestItem();
          testItem.__metadata = undefined;

          TestItem.create(testItem);

          expect(testItem).to.have.deep.property('__metadata.type', 'SP.Data.TestListItem');
        });

        it('creates a valid create request and returns the result', function() {
          sinon.spy(TestItem, '$$buildHttpConfig');
          sinon.spy(TestItem, '$$decorateResult');
          var testItem = new TestItem({foo: 'bar'});
          var query = {expand: 'Foo'};

          var result = TestItem.create(testItem, query);

          expect(TestItem.$$buildHttpConfig).to.have.been.calledWith(
            'create', {
              item: testItem,
              query: {
                select: ['Id', 'Title'],
                expand: 'Foo'
              }
            });
          expect(TestItem.$$decorateResult).to.have.been.calledWith(
            testItem,
            TestItem.$$buildHttpConfig.firstCall.returnValue
          );
          expect(result).to.be.equal(TestItem.$$decorateResult.firstCall.returnValue);

          TestItem.$$buildHttpConfig.restore();
          TestItem.$$decorateResult.restore();
        });
      });

      describe('.update(item, options)', function() {
        it('throws when item is not a ListItem', function() {
          expect(function() { TestItem.create({}); }).to.throw(Error, ['$spList:badargs']);
        });

        it('creates a valid update request and returns the result', function() {
          sinon.spy(TestItem, '$$buildHttpConfig');
          sinon.spy(TestItem, '$$decorateResult');
          var testItem = new TestItem({
            Id: 1,
            foo: 'bar',
            __metadata: {
              uri: apiRootUrl + TestItem.$$relativeUrl + '/items(1)'
            }
          });
          var options = { force: true };
          var result = TestItem.update(testItem, options);

          expect(TestItem.$$buildHttpConfig).to.have.been.calledWith(
            'update', {
              item: testItem,
              force: true
            });
          expect(TestItem.$$decorateResult).to.have.been.calledWith(
            testItem,
            TestItem.$$buildHttpConfig.firstCall.returnValue
          );
          expect(result).to.be.equal(TestItem.$$decorateResult.firstCall.returnValue);

          TestItem.$$buildHttpConfig.restore();
          TestItem.$$decorateResult.restore();
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
          sinon.spy(TestItem, '$$buildHttpConfig');
          sinon.spy(TestItem, '$$decorateResult');
          var testItem = new TestItem({
            Id: 1,
            foo: 'bar',
            __metadata: {
              uri: apiRootUrl + TestItem.$$relativeUrl + '/items(1)'
            }
          });
          var result = TestItem.delete(testItem);

          expect(TestItem.$$buildHttpConfig).to.have.been.calledWith(
            'delete', {
              item: testItem
            });
          expect(TestItem.$$decorateResult).to.have.been.calledWith(
            testItem,
            TestItem.$$buildHttpConfig.firstCall.returnValue
          );
          expect(result).to.be.equal(TestItem.$$decorateResult.firstCall.returnValue);

          TestItem.$$buildHttpConfig.restore();
          TestItem.$$decorateResult.restore();
        });
      });

      describe('.toJson(item)', function() {
        it('creates JSON from item', function() {
          var item = new TestItem({
            foo: 1
          });
          delete item.__metadata;

          expect(TestItem.toJson(item)).to.be.eql('{"foo":1}');
        });

        it('removes properties starting with $ from the payload', function() {
          var item = new TestItem({
            foo: 1,
            $bar: 2
          });
          delete item.__metadata;

          expect(TestItem.toJson(item)).to.be.eql('{"foo":1}');
          expect(item).to.have.property('$bar');
        });

        it('removes read only properties from the payload', function() {
          var item = new TestItem({
            foo: 1,
            bar: 2,
            $$readOnlyFields: ['bar']
          });
          delete item.__metadata;

          expect(TestItem.toJson(item)).to.be.eql('{"foo":1}');
          expect(item).to.have.property('bar');
        });
      });

      describe('.addNamedQuery(name, createQuery, options)', function() {
        it('adds a function with the given *name* to TestItem.queries', function() {
          TestItem.addNamedQuery('foo');

          expect(TestItem.queries.foo).to.be.a('function');
        });

        it('when executing the added function, the createQuery callback is called and its result passed to TestItem.query, together with options', function() {
          var options = {singleResult: true};
          var createQuery = sinon.stub().returns({expand: 'Foo'});
          sinon.spy(TestItem, 'query');
          TestItem.addNamedQuery('foo', createQuery, options);

          TestItem.queries.foo('something');

          expect(createQuery).to.have.been.calledWith('something');
          expect(TestItem.query).to.have.been.calledWith({
            select: ['Id', 'Title'],
            expand: 'Foo'
          }, options);

          TestItem.query.restore();
        });
      });

      describe('#$isNew()', function() {
        it('returns true when the item is in fact new', function() {
          expect((new TestItem()).$isNew()).to.be.true;
        });
        it('returns false when the item was loaded', function() {
          var item = new TestItem({
            __metadata: { id: 'something' }
          });
          expect(item.$isNew()).to.be.false;
        });
      });
    });
  });
});
