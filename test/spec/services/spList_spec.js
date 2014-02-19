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
            $select: 'foo,bar',
            $orderby: 'foo',
            $top: 2,
            $skip: 3,
            $expand: 'baz',
            $filter: 'foo eq 1'
          };
          var queryParams = "?$expand=baz&$filter=foo+eq+1&$orderby=foo&$select=foo,bar&$skip=3&$top=2";
          $httpBackend.expectGET("/testApp/_api/web/lists/getByTitle('Test')/items" + queryParams, {
            accept: 'application/json;odata=verbose'
          });

          list.query(params);

          $httpBackend.flush();
        });

        it('returns an http promise that resolves with the fetched items', function(done) {
          list.query().success(function(items) {
            expect(items).to.have.lengthOf(3);
            done();
          });

          $httpBackend.flush();
        });
      });
    });
  });
});
