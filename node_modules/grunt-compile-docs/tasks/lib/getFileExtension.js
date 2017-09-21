'use strict';

var getFileName = require('./getFileName');

module.exports = function(filePath) {

	return getFileName(filePath).split('.').pop();
};