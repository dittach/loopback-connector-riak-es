'use strict';

var async = require("neo-async");
var bucketNameComposer = require('../private/bucket_name_composer');

/**
 * Delete a model instance by id
 * @param {String} modelName The model name
 * @param {*} id The id value
 * @param [apiCallback] The callback function
 */
module.exports = function(modelName, id, apiCallback){
  var self = this;
  var bucketName = bucketNameComposer(this, modelName);

  async.series(
    [
      destroyInRiak,
      destroyInElasticsearch
    ], function(error, results){
      apiCallback(error, id);
    }
  );

  function destroyInRiak(callback){
    self.db.deleteValue({
      bucket: bucketName,
      key:    id
    }, callback);
  }

  function destroyInElasticsearch(callback){
    var indexName = bucketName.toLowerCase();

    self.elasticsearch.delete({
      index: indexName,
      type: indexName,
      id: [id, 0].join("-")
    }, function(error, result){
      // 404 is ok to ignore
      if (error && error.status === 404) return callback();
      if (error)                         return callback(error);

      callback(error, result);
    });
  }
};
