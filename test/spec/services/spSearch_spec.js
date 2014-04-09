describe('ExpertsInside.SharePoint', function() {
  describe('Service: $spSearch', function() {
    var $spSearch,
        $httpBackend;

    beforeEach(module('ExpertsInside.SharePoint'));
    beforeEach(inject(function(_$spSearch_) {
      $spSearch = _$spSearch_;
    }));

    describe('.postquery(properties)', function() {
      beforeEach(function() {
        sinon.stub($spSearch, 'query');
      });
      afterEach(function() {
        $spSearch.query.restore();
      });

      it('delegates to $spSearch.query with searchType "postquery"', function() {
        $spSearch.postquery({foo: 'bar'});

        expect($spSearch.query).to.have.been.calledWith({
          foo: 'bar',
          searchType: 'postquery'
        });
      });
    });

    describe('.suggest(properties)', function() {
      beforeEach(function() {
        sinon.stub($spSearch, 'query');
      });
      afterEach(function() {
        $spSearch.query.restore();
      });

      it('delegates to $spSearch.query with searchType "suggest"', function() {
        $spSearch.suggest({foo: 'bar'});

        expect($spSearch.query).to.have.been.calledWith({
          foo: 'bar',
          searchType: 'suggest'
        });
      });
    });
  });
});
