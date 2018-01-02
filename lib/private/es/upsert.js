module.exports = function(connector, indexName, document, callback){
  var self = connector;
  indexName = indexName.toLowerCase();

  try{
    connector.elasticsearch.index({
      // ES 6.0 only permits one type per index
      index: indexName,
      type: indexName,
      // in the future it may be necessary to break documents into
      // chunks to get around ES size limitations (namely 100MB
      // document limits). currently this is not handled besides
      // failing to index (see the 413 error
      // handler). none-the-less, we concat "-0" to the end of the
      // ID in order to leave open the possibility of multiple ES
      // documents pertaining to the same Riak key
      id: [document.id, 0].join("-"),
      body: document
    }, function (error, response) {
      if (error && error.status === 413){
        self._logger(`document ${document.id} was rejected by ES because it is too large`);
        return callback(null, null);
      }

      if (error){
        self._logger(`indexing for key ${document.id} failed with error ${error.toString()}`);
        return callback(null, null);
      }

      callback(error, response);
    });
  } catch(e) {
    self._logger(`indexing for key ${document.id} failed with exception ${e.toString()}`);
    return callback(null, null);
  }
}
