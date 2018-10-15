'use strict';

var _ = require("lodash");
var conditionsToQueryString = require('../conditions_to_query_string');
var conditionsToOptions = require('../conditions_to_options');
var camelCaseToSnakeCase = require('../camel_case_to_snake_case');

// used to find all the documents (probably not recommended)
var findAllWhere = { "id": { "neq": false } };

module.exports = async function (bucketName, conditions, apiCallback) {
	var riak = this;

	// an empty 'where' should find all the documents, although this may
	// be undesirable from a performance perspective... we'll give
	// clients rope to hang themselves here
	if (isWhereEmpty(conditions.where)) conditions.where = findAllWhere;

	var options = conditionsToOptions(conditions);

	options.index = camelCaseToSnakeCase(bucketName).toLowerCase();
	options.type = options.index;
	options.q = conditionsToQueryString(riak, bucketName, conditions.where);

	// FIXME: probably not the right choice as to what to do in this situation
	if (!options.q) return apiCallback(null, []);

	const allRecords = [];

	options.scroll = '1m';

	riak.elasticsearch.search(options, function getMoreUntilDone (error, esResponse) {
		if (esResponse && esResponse.status == 404) {
			// console.debug("elasticsearch index", options.index, "does not exist. ignoring.");
			return apiCallback(null, []);
		}

		if (
			!!error ||
			!esResponse ||
			!esResponse.hits
		) return apiCallback(error);

		esResponse.hits.hits.forEach(hit=>{ allRecords.push(hit); });
		if (esResponse.hits.total != allRecords.length) {
			riak.elasticsearch.scroll({
				scrollId: esResponse._scroll_id,
				scroll: '1m'
			}, getMoreUntilDone);
		} else {
			apiCallback(null, indexDocResponses(allRecords));
		}

	});

	function indexDocResponses(docs) {
		return _.chain(docs).
			map(function (doc) { return doc._source.id; }).
			compact().
			sortedUniq().
			valueOf();
	}

	function isWhereEmpty(where) {
		if (!where) return true;

		if (where.constructor === Array && where.length === 0) {
			return true;
		}

		if (where.constructor === Object && Object.keys(where).length === 0) {
			return true;
		}

		return false;
	}
};
