[![Build Status](https://semaphoreci.com/api/v1/dittach/loopback-connector-riak-es/branches/master/badge.svg)](https://semaphoreci.com/dittach/loopback-connector-riak-es)

## loopback-connector-riak-es

Riak + ElasticSearch connector for loopback-datasource-juggler. This adapter makes heavy use of ElasticSearch as a search front-end with Riak as the primary data store.

This adapter is based on the [official Basho Riak client library](https://github.com/basho/riak-nodejs-client) and the [official Elasticsearch client library](https://github.com/elastic/elasticsearch-js).

## Requirements

* Riak 2.x
* Node.js v0.12+
* Relational queries aren't in your technical requirements. Use a relational database. If so, Loopback supports multiple datasources, so maybe mix and match?

## Customizing Riak configuration

The Riak connector can be configured much like any other Loopback connector using the datasources JSON files.

### Example datasources file

```javascript
{
  "db": {
    "name": "db",
    "connector": "riak-es",
    "host": [
      "riak1.local.foo.com",
      "riak2.local.foo.com",
      "riak3.local.foo.com",
      "riak4.local.foo.com",
      "riak5.local.foo.com"
    ],
    "elasticsearch": "es.local.foo.com",
    "node_config" : {           //optional riak node config
      "maxConnections": 128,
      "minConnections": 1,
      "idleTimeout": 10000,
      "connectionTimeout": 3000,
      "requestTimeout": 5000,
      "cork": true
    }
  }
}
```

## Things that aren't implemented yet

* bucket types
* 'include' filter support is experimental
* relational features such as hasMany, belongsTo, hasManyAndBelongsTo, are not supported as Riak is not a relational database (there is a chance they will work, but they are not tested)

## Warnings

* Some things that are normal in other databases are expensive with Riak and this connector doesn't try to hide any of that, although it does try to take the shortest path (like looking up by key whenever possible.)
* The basho-riak-client@2.4.0 has a dependency (hoek, loaded from joi) that has a moderate vulnerability.  bash-riak-client is no longer maintained, but we contacted the author to see what options we have.  Worst case, we'll make a new npm and fix the vulnerability.

## Release notes

* 1.2.2 Fixed issue with LIMIT not being honored in search queries.
* 1.2.1 Fixed error in console logging on undefined index
* 1.2.0 Tests passing with ElasticSearch
* 1.0.0 Currently in production over at Dittach. Tests are passing.
* 0.1.x Improvements to test coverage, feature support, Node v0.12+ support.
* 0.0.x Proof-of-concept releases
