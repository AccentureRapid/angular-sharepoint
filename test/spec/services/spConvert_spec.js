describe('ExpertsInside.SharePoint', function() {
  describe('Service: $spConvert', function() {
    var $spConvert;

    beforeEach(module('ExpertsInside.SharePoint'));
    beforeEach(inject(function(_$spConvert_) {
      $spConvert = _$spConvert_;
    }));

    describe('.spKeyValue(keyValue)', function() {
      var createKeyValue = function(valueType, value) {
        return {
          __metadata: { type: "SP.KeyValue" },
          Key: 'Key',
          Value: value,
          ValueType: valueType
        };
      };

      it('converts SP.KeyValue with value type Edm.Int{16,32,64}', function() {
        expect($spConvert.spKeyValue(createKeyValue('Edm.Int16', '1'))).to.be.eql(1);
        expect($spConvert.spKeyValue(createKeyValue('Edm.Int32', '2'))).to.be.eql(2);
        expect($spConvert.spKeyValue(createKeyValue('Edm.Int64', '3'))).to.be.eql(3);
        expect($spConvert.spKeyValue(createKeyValue('Edm.Byte', '4'))).to.be.eql(4);
      });

      it('converts SP.KeyValue with value type Edm.Double', function() {
        expect($spConvert.spKeyValue(createKeyValue('Edm.Double', '1.23'))).to.be.eql(1.23);
      });

      it('converts SP.KeyValue with value type Edm.Float', function() {
        expect($spConvert.spKeyValue(createKeyValue('Edm.Float', '1.23'))).to.be.eql(1.23);
      });

      it('converts SP.KeyValue with value type Edm.Boolean', function() {
        expect($spConvert.spKeyValue(createKeyValue('Edm.Boolean', 'true'))).to.be.eql(true);
        expect($spConvert.spKeyValue(createKeyValue('Edm.Boolean', 'false'))).to.be.eql(false);
      });
    });

    describe('.spKeyValueArray(keyValues)', function() {
      it('creates an object whose properties are the keys of the keyValues and the values are the parsed values', function() {
        var keyValues = [
          { Key: 'Foo', Value: '1', ValueType: 'Edm.Int32', __metadata: { type: 'SP.KeyValue' } },
          { Key: 'Bar', Value: '2.3', ValueType: 'Edm.Float', __metadata: { type: 'SP.KeyValue' } }
        ];

        var result = $spConvert.spKeyValueArray(keyValues);

        expect(result).to.be.eql({
          Foo: 1,
          Bar: 2.3
        });
      });
    });

    describe('.spSimpleDataRow(row)', function() {
      it('throws an error when row is not a SP.SimpleDataRow', function() {
        var row = { __metadata: { type: 'SP.Foo' } };

        expect(function() { $spConvert.spSimpleDataRow(row); }).to.throw(Error, '[$spConvert:badargs]');
      });

      it('creates an object whose properties are the keys of the cells and the values are the parsed cell values', function() {
        var row = {
          __metadata: { type: 'SP.SimpleDataRow' },
          Cells: {
            results: [
              { Key: 'Foo', Value: '1', ValueType: 'Edm.Int32', __metadata: { type: 'SP.KeyValue' } },
              { Key: 'Bar', Value: '2.3', ValueType: 'Edm.Float', __metadata: { type: 'SP.KeyValue' } }
            ]
          }
        };

        var result = $spConvert.spSimpleDataRow(row);

        expect(result).to.be.eql({
          Foo: 1,
          Bar: 2.3
        });
      });
    });

    describe('.spSimpleDataTable(table)', function() {
      it('throws an error when row is not a SP.SimpleDataTable', function() {
        var table = { __metadata: { type: 'SP.Foo' } };

        expect(function() { $spConvert.spSimpleDataTable(table); }).to.throw(Error, '[$spConvert:badargs]');
      });

      it('creates an array of converted simple data rows', function() {
        var table = {
          __metadata: { type: 'SP.SimpleDataTable' },
          Rows: {
            results: [{
              __metadata: { type: 'SP.SimpleDataRow' },
              Cells: {
                results: [
                  { Key: 'Foo', Value: '1', ValueType: 'Edm.Int32', __metadata: { type: 'SP.KeyValue' } },
                  { Key: 'Bar', Value: '2.3', ValueType: 'Edm.Float', __metadata: { type: 'SP.KeyValue' } }
                ]
              }
            }, {
              __metadata: { type: 'SP.SimpleDataRow' },
              Cells: {
                results: [
                  { Key: 'Foo', Value: '4', ValueType: 'Edm.Int32', __metadata: { type: 'SP.KeyValue' } },
                  { Key: 'Bar', Value: '5.6', ValueType: 'Edm.Float', __metadata: { type: 'SP.KeyValue' } }
                ]
              }
            }]
          }
        };

        var result = $spConvert.spSimpleDataTable(table);

        expect(result).to.be.eql([{
          Foo: 1,
          Bar: 2.3
        }, {
          Foo: 4,
          Bar: 5.6
        }]);
      });
    });

    describe('.searchResult(searchResult)', function() {
      it('throws an error when row is not a Microsoft.Office.Server.Search.REST.SearchResult', function() {
        var searchResult = { __metadata: { type: 'SP.Foo' } };

        expect(function() { $spConvert.searchResult(searchResult); }).to.throw(Error, '[$spConvert:badargs]');
      });

      it('creates an array of converted simple data rows', function() {
        var searchResult = {
          __metadata: { type: 'Microsoft.Office.Server.Search.REST.SearchResult' },
          ElapsedTime: '123',
          SpellingSuggestion: '',
          PrimaryQueryResult: {
            QueryId: "dcbbd035-d6e5-47a6-bbda-da0a7f3a49a6",
            QueryRuleId: "00000000-0000-0000-0000-000000000000",
            CustomResults: null,
            RefinementResults: null,
            SpecialTermResults: null,
            RelevantResults: {
              Table: {
                __metadata: { type: 'SP.SimpleDataTable' },
                Rows: {
                  results: [{
                    __metadata: { type: 'SP.SimpleDataRow' },
                    Cells: {
                      results: [
                        { Key: 'Foo', Value: '1', ValueType: 'Edm.Int32', __metadata: { type: 'SP.KeyValue' } },
                        { Key: 'Bar', Value: '2.3', ValueType: 'Edm.Float', __metadata: { type: 'SP.KeyValue' } }
                      ]
                    }
                  }, {
                    __metadata: { type: 'SP.SimpleDataRow' },
                    Cells: {
                      results: [
                        { Key: 'Foo', Value: '4', ValueType: 'Edm.Int32', __metadata: { type: 'SP.KeyValue' } },
                        { Key: 'Bar', Value: '5.6', ValueType: 'Edm.Float', __metadata: { type: 'SP.KeyValue' } }
                      ]
                    }
                  }]
                }
              }
            }
          },
          Properties: {
            results: [
              { Key: 'Foo', Value: '1', ValueType: 'Edm.Int32', __metadata: { type: 'SP.KeyValue' } }
            ]
          }
        };

        var result = $spConvert.searchResult(searchResult);

        // console.log(JSON.stringify(result, null, 2));
        expect(result).to.be.eql({
          elapsedTime: '123',
          spellingSuggestion: '',
          properties: { Foo: 1 },
          primaryQueryResult: {
            queryId: "dcbbd035-d6e5-47a6-bbda-da0a7f3a49a6",
            queryRuleId: "00000000-0000-0000-0000-000000000000",
            customResults: null,
            refinementResults: null,
            specialTermResults: null,
            relevantResults:[{
              Foo: 1,
              Bar: 2.3
            }, {
              Foo: 4,
              Bar: 5.6
            }]
          }
        });
      });
    });

    describe('.capitalize(str)', function() {
      it('returns null when *str* in undefined', function () {
        expect($spConvert.capitalize(null)).to.be.null;
      });

      it('Upcases the first letter in the *str*', function () {
        expect($spConvert.capitalize('foo')).to.be.eql('Foo');
      });
    });
  });
});
