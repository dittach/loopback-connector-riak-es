'use strict';

var async = require('neo-async');
var bucketNameComposer = require('../private/bucket_name_composer');

module.exports = function(bucketName, conditions, mapIterator, apiCallback){
  var unlimitedSearch = require('../private/unlimited_search')(this);

  var self = this;
  var modelName = bucketNameComposer.decompose(this, bucketName);

  async.waterfall([
    findIds,
    mapResults,
    parallelize
  ], apiCallback);

  function findIds(callback){
    if(conditions.limit || conditions.where.limit){
      findLimited(callback)
    } else{
      findUnlimited(callback);
    }
  }

  function findUnlimited(callback){
    unlimitedSearch(bucketName, conditions, function(error, ids){
      if (error) return callback(error);
      if (!ids)  return apiCallback(null, null);

      callback(null, ids);
    });
  }

  function findLimited(callback){
    self.search(bucketName, conditions, function(error, results){
      if (error)    return callback(error);
      if (!results) return apiCallback(null, null);

      callback(null, results);
    });
  }

  function mapResults(searchResultIds, callback){
    callback(null, searchResultIds.map(function(id){
      return function(mapCallback){
        // since map most likely maps to other 'first-level' api
        // methods, which take a modelName rather than a bucketName,
        // we should pass the modelName back here
        mapIterator.call(self, modelName, id, mapCallback);
      }
    }));
  }

  function parallelize(mapQueries, callback){
    // fetch in parallel limited to the number of hosts in the riak cluster
    async.parallelLimit(mapQueries, self.settings.host.length, callback);
  }
}
