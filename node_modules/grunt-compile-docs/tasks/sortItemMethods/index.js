'use strict';

var fs = require('fs');

var getFileBaseName = require('../lib/getFileBaseName');

module.exports = {};

var files = fs.readdirSync(__dirname);

files.forEach(function(file) {

	var name = getFileBaseName(file);

	if (name !== 'index') {
		module.exports[name] = require(__dirname + '/' + file);
	}
});
