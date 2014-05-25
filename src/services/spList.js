/**
 * @ngdoc service
 * @name ExpertsInside.SharePoint.$spList
 * @requires ExpertsInside.SharePoint.$spRest
 *
 * @description A factory which creates a list item resource object that lets you interact with
 *   SharePoint List Items via the SharePoint REST API.
 *
 *   The returned list item object has action methods which provide high-level behaviors without
 *   the need to interact with the low level $http service.
 *
 * @param {string} name The name of the SharePoint List (case-sensitive).
 *
 * @param {Object=} options Hash with custom options for this List. The following options are
 *   supported:
 *
 *   - **`readOnlyFields`** - {Array.{string}=} - Array of field names that will be exlcuded
 *   from the request when saving an item back to SharePoint
 *   - **`queryDefaults`** - {Object=} - Default query parameter used by each action. Can be
 *   overridden per action. See {@link ExpertsInside.SharePoint.$spList query} for details.
 *
 * @return {Object} A list item "class" object with methods for the default set of resource actions.
 *
 * # List Item class
 *
 * All query parameters accept an object with the REST API query string parameters. Prefixing them with $ is optional.
 *   - **`$select`**
 *   - **`$filter`**
 *   - **`$orderby`**
 *   - **`$top`**
 *   - **`$skip`**
 *   - **`$expand`**
 *   - **`$sort`**
 *
 * ## Methods
 *
 *   - **`get`** - {function(id, query)} - Get a single list item by id.
 *   - **`query`** - {function(query, options)} - Query the list for list items and returns the list
 *     of query results.
 *     `options` supports the following properties:
 *       - **`singleResult`** - {boolean} - Returns and empty object instead of an array. Throws an
 *         error when more than one item is returned by the query.
 *   - **`create`** - {function(item, query)} - Creates a new list item. Throws an error when item is
 *     not an instance of the list item class.
 *   - **`update`** - {function(item, options)} - Updates an existing list item. Throws an error when
 *     item is not an instance of the list item class. Supported options are:
 *       - **`query`** - {Object} - Query parameters for the REST call
 *       - **`force`** - {boolean} - If true, the etag (version) of the item is excluded from the
 *         request and the server does not check for concurrent changes to the item but just 
 *         overwrites it. Use with caution.
 *   - **`save`** - {function(item, options)} - Either creates or updates the item based on its state.
 *     `options` are passed down to `update` and and `options.query` are passed down to `create`.
 *   - **`delete`** - {function(item)} - Deletes the list item. Throws an error when item is not an
 *     instance of the list item class.
 *
 * @example
 *
 * # Todo List
 *
 * ## Defining the Todo class
 * ```js
     var Todo = $spList('Todo', {
       queryDefaults: ['Id', 'Title', 'Completed']
     );
 * ```
 *
 * ## Queries
 *
 * ```js
     // We can retrieve all list items from the server.
     var todos = Todo.query();

    // Or retrieve only the uncompleted todos.
    var todos = Todo.query({
      filter: 'Completed eq 0'
    });

    // Queries that are used in more than one place or those accepting a parameter can be defined 
    // as a function on the class
    Todo.addNamedQuery('uncompleted', function() {
      filter: "Completed eq 0"
    });
    var uncompletedTodos = Todo.queries.uncompleted();
    Todo.addNamedQuery('byTitle', function(title) {
      filter: "Title eq " + title
    });
    var fooTodo = Todo.queries.byTitle('Foo');
 * ```
 */
angular.module('ExpertsInside.SharePoint')
  .factory('$spList', function($spRest, $http) {
    'use strict';
    var $spListMinErr = angular.$$minErr('$spList');

    function listFactory(name, options) {
      if (!angular.isString(name) || name === '') {
        throw $spListMinErr('badargs', 'name must be a nen-empty string.');
      }
      if(!angular.isObject(options)) {
        options = {};
      }
      var upcaseName = name.charAt(0).toUpperCase() + name.slice(1);

      function ListItem(data) {
        angular.extend(this, data);
      }

      ListItem.$$listName = name;
      ListItem.getListName = function() { return ListItem.$$listName; };
      ListItem.$$listRelativeUrl = "web/lists/getByTitle('" + name + "')";
      ListItem.$decorateResult = function(result, httpConfig) {
        if (!angular.isArray(result) && !(result instanceof ListItem)) {
          result = new ListItem(result);
        }
        if (angular.isUndefined(result.$resolved)) {
          result.$resolved = false;
        }
        result.$promise = $http(httpConfig).then(function(response) {
          var data = response.data;

          if (angular.isArray(result) && angular.isArray(data)) {
            angular.forEach(data, function(item) {
              result.push(new ListItem(item));
            });
          } else if (angular.isObject(result)) {
            if (angular.isArray(data)) {
              if (data.length === 1) {
                angular.extend(result, data[0]);
              } else {
                throw $spListMinErr('badresponse', 'Expected response to contain an array with one object but got {1}',
                  data.length);
              }
            } else if (angular.isObject(data)) {
              angular.extend(result, data);
            }
          } else {
            throw $spListMinErr('badresponse', 'Expected response to contain an {0} but got an {1}',
              angular.isArray(result) ? 'array' : 'object', angular.isArray(data) ? 'array' : 'object');
          }

          var responseEtag;
          if(response.status === 204 && angular.isString(responseEtag = response.headers('ETag'))) {
            result.__metadata.etag = responseEtag;
          }
          result.$resolved = true;

          return result;
        });

        return result;
      };
      ListItem.get = function(id, query) {
        if (angular.isUndefined(id) || id === null) {
          throw $spListMinErr('badargs', 'id is required.');
        }

        var result = {
          Id: id
        };
        var httpConfig = $spRest.buildHttpConfig(ListItem.$$listRelativeUrl, 'get', {id: id, query: query});

        return ListItem.$decorateResult(result, httpConfig);
      };
      ListItem.query = function(query, options) {
        var result = (angular.isDefined(options) && options.singleResult) ? {} : [];
        var httpConfig = $spRest.buildHttpConfig(ListItem.$$listRelativeUrl, 'query', {
          query: angular.extend({}, ListItem.prototype.$settings.queryDefaults, query)
        });

        return ListItem.$decorateResult(result, httpConfig);
      };
      ListItem.create = function(item, query) {
        if (!(angular.isObject(item) && item instanceof ListItem)) {
          throw $spListMinErr('badargs', 'item must be a ListItem instance.');
        }
        var type = item.$settings.itemType;
        if (!type) {
          throw $spListMinErr('badargs', 'Cannot create an item without a valid type');
        }

        item.__metadata = {
          type: type
        };
        var httpConfig = $spRest.buildHttpConfig(ListItem.$$listRelativeUrl, 'create', {
          item: item,
          query: angular.extend({}, item.$settings.queryDefaults, query)
        });

        return ListItem.$decorateResult(item, httpConfig);
      };
      ListItem.update = function(item, options) {
        if (!(angular.isObject(item) && item instanceof ListItem)) {
          throw $spListMinErr('badargs', 'item must be a ListItem instance.');
        }

        options = angular.extend({}, options, {
          item: item
        });

        var httpConfig = $spRest.buildHttpConfig(ListItem.$$listRelativeUrl, 'update', options);

        return ListItem.$decorateResult(item, httpConfig);
      };
      ListItem.save = function(item, options) {
        if (angular.isDefined(item.__metadata) && angular.isDefined(item.__metadata.id)) {
          return this.update(item, options);
        } else {
          var query = angular.isObject(options) ? options.query : undefined;
          return this.create(item, query);
        }
      };
      ListItem.delete = function(item) {
        if (!(angular.isObject(item) && item instanceof ListItem)) {
          throw $spListMinErr('badargs', 'item must be a ListItem instance.');
        }
        var httpConfig = $spRest.buildHttpConfig(ListItem.$$listRelativeUrl, 'delete', {item: item});

        return ListItem.$decorateResult(item, httpConfig);
      };
      ListItem.queries = { };
      ListItem.addNamedQuery = function(name, createQuery, options) {
        ListItem.queries[name] = function() {
          var query = angular.extend(
            {},
            ListItem.prototype.$settings.queryDefaults,
            createQuery.apply(ListItem, arguments)
          );
          return ListItem.query(query, options);
        };
        return ListItem;
      };

      ListItem.prototype = {
        $settings: {
          itemType: 'SP.Data.' + upcaseName + 'ListItem',
          readOnlyFields: angular.extend([
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
          ], options.readOnlyFields),
          queryDefaults: angular.extend({}, options.queryDefaults)
        },
        $save: function(options) {
          return ListItem.save(this, options).$promise;
        },
        $delete: function() {
          return ListItem.delete(this).$promise;
        },
        $isNew: function() {
          return angular.isUndefined(this.__metadata) || angular.isUndefined(this.__metadata.id);
        }
      };

      return ListItem;
    }

    return listFactory;
  });
