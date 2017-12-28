'use strict';

var async         = require('async');
var Riak          = require('basho-riak-client');
var elasticsearch = require('elasticsearch');

/**
* Connect to Riak
* RiakJS doesn't connect per se but we'll ping the db to make sure it
* works.
*
* @param {Function} [apiCallback] The callback function
*
* @callback callback
* @param {Error} err The error object
* @param {Db} db The riak client object
*/
module.exports = function(apiCallback){
  var self = this;

  if (!Array.isArray(this.settings.host)) this.settings.host = [ this.settings.host ];

  this.db = new Riak.Client(this.settings.host);

  this.elasticsearch = new elasticsearch.Client({
    host: this.settings.elasticsearch
  });

  this._models = this._models || {};

  if (!apiCallback) return;

  async.parallel(
    [
      this.ping.bind(this),
      function(callback){ self.elasticsearch.ping({}, callback); }
    ],
    function(error, responses){
      if (error)                             onConnectionFailure(error);
      else if (responses[0] && responses[1]) onConnectionSuccess();
      else                                   onUnexpectedError();

      apiCallback(error, self.db);
    }
  );

  function onConnectionSuccess(){
    self._logger('connection is established to host:', self.settings.host);
    self._logger('search connection is established to host:', self.settings.elasticsearch);
  }

  function onConnectionFailure(error){
    self._logger('connection failed:', error);
  }

  function onUnexpectedError(){
    self._logger("unexpected issue connecting to Riak or Elasticsearch");
  }
}
