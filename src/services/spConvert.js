angular.module('ExpertsInside.SharePoint')
  .factory('$spConvert', function() {
    'use strict';

    var assertType = function(type, obj) {
      if (!angular.isObject(obj.__metadata) || obj.__metadata.type !== type) {
        throw $spConvertMinErr('badargs', 'expected argument to be of type {0}.', type);
      }
    };

    var $spConvertMinErr = angular.$$minErr('$spConvert');
    var $spConvert = {
      spKeyValue: function(keyValue) {
        assertType("SP.KeyValue", keyValue);
        var value = keyValue.Value;

        switch(keyValue.ValueType) {
        case 'Edm.Double':
        case 'Edm.Float':
          return parseFloat(value);
        case 'Edm.Int16':
        case 'Edm.Int32':
        case 'Edm.Int64':
        case 'Edm.Byte':
          return parseInt(value, 10);
        case 'Edm.Boolean':
          return value === "true";
        default:
          return value;
        }
      },

      spKeyValueArray: function(keyValues) {
        var result = {};

        for (var i = 0, l = keyValues.length; i < l; i+=1) {
          var keyValue = keyValues[i];
          var key = keyValue.Key.charAt(0).toLowerCase() + keyValue.Key.slice(1);
          result[key] = $spConvert.spKeyValue(keyValue);
        }

        return result;
      },

      spSimpleDataRow: function(row) {
        assertType("SP.SimpleDataRow", row);
        var cells = row.Cells.results || [];

        return $spConvert.spKeyValueArray(cells);
      },

      spSimpleDataTable: function(table) {
        assertType("SP.SimpleDataTable", table);
        var result = [];
        var rows = table.Rows.results || [];

        for (var i = 0, l = rows.length; i < l; i+=1) {
          var row = rows[i];
          result.push($spConvert.spSimpleDataRow(row));
        }

        return result;
      },

      searchResult: function(searchResult) {
        assertType("Microsoft.Office.Server.Search.REST.SearchResult", searchResult);
        var primaryQueryResult = searchResult.PrimaryQueryResult;

        var result = {
          elapsedTime: searchResult.ElapsedTime,
          spellingSuggestion: searchResult.SpellingSuggestion,
          properties: $spConvert.spKeyValueArray(searchResult.Properties.results),
          primaryQueryResult: {
            queryId: primaryQueryResult.QueryId,
            queryRuleId: primaryQueryResult.QueryRuleId,
            relevantResults: $spConvert.spSimpleDataTable(primaryQueryResult.RelevantResults.Table),
            customResults: primaryQueryResult.CustomResults !== null ? $spConvert.spSimpleDataTable(primaryQueryResult.CustomResults.Table) : null,
            refinementResults: primaryQueryResult.RefinementResults !== null ? $spConvert.spSimpleDataTable(primaryQueryResult.RefinementResults.Table) : null,
            specialTermResults: primaryQueryResult.SpecialTermResults !== null ? $spConvert.spSimpleDataTable(primaryQueryResult.SpecialTermResults.Table) : null
          }
        };

        return result;
      },

      suggestResult: function(suggestResult) {
        // TODO implement
        return suggestResult;
      },

      userResult: function(userResult) {
        assertType("SP.UserProfiles.PersonProperties", userResult);

        var result = {
          accountName: userResult.AccountName,
          displayName: userResult.DisplayName,
          email: userResult.Email,
          isFollowed: userResult.IsFollowed,
          personalUrl: userResult.PersonalUrl,
          pictureUrl: userResult.PictureUrl,
          profileProperties: $spConvert.spKeyValueArray(userResult.UserProfileProperties),
          title: userResult.Title,
          userUrl: userResult.UserUrl
        };

        return result;
      }
    };

    return $spConvert;
  });
