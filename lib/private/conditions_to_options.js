'use strict';

module.exports = conditions => {
	const options = {};

	rowQuery(options);
	sortQuery(options);
	startQuery(options);

	return options;

	function rowQuery() {
		const rows = (typeof conditions.limit !== 'undefined') ? parseInt(conditions.limit, 10) :
			(typeof conditions.where.limit !== 'undefined') ? parseInt(conditions.where.limit, 10) : 500;

		if (isNaN(rows)) return;

		options.size = rows;
	}

	// comes in as:
	// { order: ['propertyName <ASC|DESC>', 'propertyName <ASC|DESC>',...] }
	function sortQuery() {
		if (!conditions.order) conditions.order = 'id ASC';

		if (conditions.order.constructor === String) {
			if (conditions.order.indexOf(' ') === -1) {
				// if no direction provided, default to ascending direction
				conditions.order = [conditions.order, 'ASC'].join(' ');
			}

			conditions.order = [conditions.order];
		}

		if (conditions.order.constructor !== Array) return;

		const sort = [];

		let specComponents;
		const validDirections = ['asc', 'desc'];

		conditions.order.forEach(orderSpec => {
			specComponents = orderSpec.split(' ');
			specComponents[1] = specComponents[1].toLowerCase();

			// exclude invalid directions
			if (validDirections.indexOf(specComponents[1]) === -1) return;

			sort.push(specComponents.join(':'));
		});

		options.sort = sort.join(',');
	}

	function startQuery() {
		const start_skip = parseInt(conditions.skip, 10);
		const start_offset = parseInt(conditions.offset, 10);

		if (isNaN(start_skip)) {
			if (isNaN(start_offset)) {
				return;
			} else {
				options.from = start_offset;
			}
		} else {
			options.from = start_skip;
		}

	}
};
