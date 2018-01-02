var async = require('neo-async');
var fs = require('fs');

module.exports = require('should');

var DataSource = require('loopback-datasource-juggler').DataSource;
var config = require('rc')('loopback', {test: {riak: {}}}).test.riak;

global.getConfig = function (options) {
  var dbConf = {
    host: 'localhost',
    port: 8098,
    elasticsearch: 'localhost:9200'
  };

  if (options) {
    for (var el in options) {
      dbConf[el] = options[el];
    }
  }

  return dbConf;
};

global.getDataSource = global.getSchema = function (options) {
  var db = new DataSource(require('../'), getConfig(options));

  var originalSearch = db.connector.search;

  // we need to add some delay to account for indexing time before we
  // count or search the index. one second seems to be enough. 500ms
  // not so much. YMMV
  db.connector.search = function(){
    var args = arguments;

    setTimeout(function(){
      originalSearch.apply(db.connector, args);
    }, 1000);
  }

  var originalCount = db.connector.count;
  db.connector.count = function(){
    var args = arguments;

    setTimeout(function(){
      originalCount.apply(db.connector, args);
    }, 1000);
  }

  return db;
};

var camelCaseToSnakeCase = function(str){
  return str.replace(/([A-Z])/g, function($1){return "_"+$1.toLowerCase();}).replace(/^_/, "");
}

var prepareBucketForSearching = function(db, bucketName, callback){
  var indexName = camelCaseToSnakeCase(bucketName).toLowerCase();
  var elasticsearch = db.connector.elasticsearch;
  var mapping = fs.readFileSync("./test/mappings/" + indexName + ".json").toString('utf8');

  console.log("creating '", indexName, "' es index...");

  // :( :( this is definitely not fun. basically because yokozuna is
  // solr and solr is lucene, the interactions between riak and solr
  // take indeterminate amounts of time and we have to basically give
  // plennntttty of time for them to get in sync when we make changes

  console.log("destroying '", indexName, "' index...");
  elasticsearch.indices.delete({index: indexName}, function(){
    console.log("creating '", indexName, "' index...");
    elasticsearch.indices.create({index: indexName, body: mapping}, function(error, result){
      if (result.acknowledged){
        console.log("index '", indexName, "' created");
      } else {
        console.log("problem creating index '", indexName);
      }

      callback();
    });
  });
}

global.prepareDatabaseForTests = function(prepareCallback){
  var db = getSchema();

  async.each([
    "Model",
    "User",
    "Person",
    "Book",
    "Chapter",
    "Author",
    "Reader",
    "Physician",
    "Patient",
    "Appointment",
    "Address",
    "Category",
    "Picture",
    "PictureLink",
    "Item",
    "Passport",
    "Supplier",
    "Article",
    "TagName",
    "Job",
    "List",
    "Account",
    "ArticleTagName",
    "Post",
    "AccessToken",
    "Assembly",
    "AssemblyPart",
    "Part"
  ], function(bucketName, callback){
    prepareBucketForSearching(db, bucketName, callback);
  }, prepareCallback);
}
