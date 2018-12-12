'use strict';

const async = require('neo-async');
const extend = require('util')._extend;

const elasticsearchUpsert = require('../private/es/upsert');
const bucketNameComposer = require('../private/bucket_name_composer');

/**
 * Update properties for the model instance data
 * @param {String} model The model name
 * @param {Object} data The model data
 * @param {Function} [apiCallback] The callback function
 */
module.exports = function (modelName, id, data, apiCallback) {
	let self = this;
	const ENABLE_DEBUG_MSGS = false;
	const watchlist_ids = ['a21924c0-cace-11e7-aa1c-d799e55ef7f6', '94cdcf12-21e4-40a2-88fb-0797f3419407', '51d644f1-b9dc-11e7-b24a-7dd408a87cce'];

	if (ENABLE_DEBUG_MSGS && watchlist_ids.indexOf(id) > -1) { console.log('update_attributes called with modelName:', modelName, ', id:', id, ', data:', data); }

	if (!id) throw new Error('Riak updateAttributes called for a document with no id');

	const bucketName = bucketNameComposer(self, modelName);

	async.waterfall([
		find,
		merge,
		save,
		index
	], apiCallback);

	function find(callback) {
		self.find(modelName, id, function (error, result) {
			if (ENABLE_DEBUG_MSGS && watchlist_ids.indexOf(id) > -1) { console.log('find() callback, error:', error, ', result:', result); }

			if (error) return callback(error);
			if (!result) return apiCallback(null, null);

			callback(error, result);
		});
	}

	function merge(document, callback) {
		if (ENABLE_DEBUG_MSGS && watchlist_ids.indexOf(id) > -1) {
			const mergedObj = extend(document, data);
			console.log('merge() called, document:', document, ', data:', data);
			console.log('merge(), mergedObj:', mergedObj);
		}

		callback(null, extend(document, data));
	}

	function save(updatedDocument, callback) {
		self.save(bucketName, updatedDocument, function (error, success) {
			if (ENABLE_DEBUG_MSGS && watchlist_ids.indexOf(id) > -1) {
				console.log('save() callback called, updatedDocument:', updatedDocument, ', bucketName:', bucketName);
				console.log('save() callback, error:', error, ', success:', success);
			}

			if (error) return callback(error);

			callback(null, updatedDocument);
		});
	}

	function index(updatedDocument, callback) {
		elasticsearchUpsert(self, bucketName.toLowerCase(), updatedDocument, function (error, _result) {
			if (ENABLE_DEBUG_MSGS && watchlist_ids.indexOf(id) > -1) {
				console.log('index() elasticsearchUpsert() callback called, updatedDocument:', updatedDocument, ', bucketName:', bucketName.toLowerCase());
				console.log('index() elasticsearchUpsert() callback, error:', error, ', _result:', _result);
			}

			callback(error, updatedDocument);
		});
	}
};
