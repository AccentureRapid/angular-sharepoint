describe('ExpertsInside.SharePoint', function() {
  'use strict';

  describe('Service: $spList', function() {
    var $spPageContextInfo,
        $spList,
        $httpBackend;

    beforeEach(module('ExpertsInside.SharePoint'));
    beforeEach(inject(function(_$spList_, _$spPageContextInfo_, _$httpBackend_) {
      $spList = _$spList_;
      $spPageContextInfo = _$spPageContextInfo_;
      $httpBackend = _$httpBackend_;
      $spPageContextInfo.webServerRelativeUrl = '/testApp';
    }));

    it('is defined', function() {
      expect($spList).not.to.be.undefined;
    });

    it('is a factory function for list objects', function() {
      expect($spList).to.be.a('function');
      expect($spList()).to.be.instanceOf($spList.List);
    });

    describe('List', function() {
      var list;

      beforeEach(function() {
        list = $spList('Test');
      });

      it('#$baseUrl()', function() {
        expect(list.$baseUrl()).to.be.equal("/testApp/_api/web/lists/getByTitle('Test')");
      });

      describe('#get(id)', function() {
        beforeEach(function() {
          $httpBackend.whenGET("/testApp/_api/web/lists/getByTitle('Test')/items(1)", {
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

        it('returns an http promise that resolves with the fetched item', function(done) {
          list.get(1).success(function(item) {
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
    });
  });
});
