'use strict';

var async         = require('neo-async');
var Riak = require('basho-riak-client');
var elasticsearch = require('elasticsearch');
var deepExtend = require('deep-extend');

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

  this.settings.node_config = this.settings.node_config || {};

  deepExtend(this.settings.node_config, {
    "maxConnections": 128,
    "minConnections": 1,
    "idleTimeout": 10000,
    "connectionTimeout": 3000,
    "cork": true
  });

  var nodes = Riak.Node.buildNodes(this.settings.host, this.settings.node_config);
  var cluster = new Riak.Cluster.Builder().withRiakNodes(nodes).build();

  this._models = this._models || {};

  this.db = new Riak.Client(cluster);

  this.elasticsearch = new elasticsearch.Client({
    host: this.settings.elasticsearch
  });

  async.parallel(
    [
      self.ping.bind(self),
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
};
