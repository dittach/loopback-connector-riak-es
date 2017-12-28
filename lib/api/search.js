'use strict';

var conditionsToQueryString = require('../private/conditions_to_query_string');
var conditionsToOptions     = require('../private/conditions_to_options');
var camelCaseToSnakeCase    = require('../private/camel_case_to_snake_case');

// used to find all the documents (probably not recommended)
var findAllWhere = { "id": { "neq": false } };

module.exports = function(bucketName, conditions, apiCallback){
  var riak = this;

  // an empty 'where' should find all the documents, although this may
  // be undesirable from a performance perspective... we'll give
  // clients rope to hang themselves here
  if (isWhereEmpty(conditions.where)) conditions.where = findAllWhere;

  var options = conditionsToOptions(conditions);

  options.index = camelCaseToSnakeCase(bucketName);
  options.q     = conditionsToQueryString(riak, bucketName, conditions.where);

  // FIXME: probably not the right choice as to what to do in this situation
  if (!options.q) return apiCallback(null, []);

  riak.elasticsearch.search(options, function(error, esResponse){
    if (esResponse && esResponse.status == 404){
      console.debug("elasticsearch index", options.indexName, "does not exist. ignoring.");
      return apiCallback(null, []);
    }

    if (
      !!error ||
      !esResponse ||
      !esResponse.hits
    ) return apiCallback("unexpected error");

    apiCallback(null, indexDocResponses(esResponse.hits.hits));
  });

  function indexDocResponses(docs){
    var out = {};
    var id;

    // I think a more convenient format is to return the doc responses
    // indexed by key. that way you can do Object.keys(docs) and pull
    // those keys right quick
    docs.forEach(function(docResponse){
      id = docResponse._source.id;
      out[id] = docResponse;
    });

    return out;
  }

  function isWhereEmpty(where){
    if (!where) return true;

    if (where.constructor === Array && where.length === 0){
      return true;
    }

    if (where.constructor === Object && Object.keys(where).length === 0){
      return true;
    }

    return false;
  }
};
