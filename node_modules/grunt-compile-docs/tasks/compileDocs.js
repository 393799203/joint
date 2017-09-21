'use strict';

module.exports = function(grunt) {

	var async = require('async');
	var marked = require('marked');

	var getFileExtension = require('./lib/getFileExtension');
	var sortItemMethods = require('./sortItemMethods');

	grunt.registerMultiTask('compileDocs', 'Compile documentation.', function() {

		var done = this.async();
		var options = this.options({
			flatten: false
		});

		if (!options.template) {
			return done(new Error('Missing required option: "template"'));
		}

		var template = options.compileTemplate(grunt.file.read(options.template));

		if (options.markdown) {
			marked.setOptions(options.markdown);
		}

		var createdFiles = 0;

		async.each(this.files, function(file, next) {

			async.parallel({
				intro: getIntro.bind(undefined, file, options),
				items: getItems.bind(undefined, file, options)
			}, function(error, results) {

				if (error) return next(error);

				var data = file.meta || {};

				data.intro = results.intro;
				data.items = results.items;

				if (data.items.length > 0) {

					var processItems = file.processItems || options.processItems;
					var sortItems = file.sortItems || options.sortItems;

					if (processItems) {
						data.items = data.items.map(processItems);
					}

					if (sortItems) {

						if (typeof sortItems === 'string') {
							sortItems = sortItemMethods[sortItems] || null;
						}

						if (sortItems) {
							data.items.sort(sortItems);
						}
					}

					if (!options.flatten) {
						data.items = unflatten(data.items);
					}
				}

				grunt.file.write(file.dest, template(data));
				createdFiles++;
				grunt.log.writeln('File ' + file.dest['cyan'] + ' created.');
				next();
			});

		}, function(error) {

			if (error) return done(error);

			if (createdFiles > 0) {
				grunt.log.ok(createdFiles + ' ' + grunt.util.pluralize(createdFiles, 'file/files') + ' created.');
			} else {
				grunt.log.warn('No files created.');
			}

			done();
		});
	});

	function unflatten(items) {

		var tree = [];
		var itemHash = {};

		items.forEach(function(item) {
			itemHash[item.key] = item;
		});

		items.forEach(function(item) {

			var pos;
			var parentKey;

			while ((pos = (parentKey || item.key).lastIndexOf('.')) !== -1) {

				parentKey = (parentKey || item.key).substr(0, pos);

				if (!itemHash[parentKey]) {

					itemHash[parentKey] = {
						key: parentKey,
						content: ''
					}
				}
			}
		});

		Object.keys(itemHash).forEach(function(key) {

			var pos = key.lastIndexOf('.');

			if (pos !== -1) {

				var parentKey = key.substr(0, pos);

				if (!itemHash[parentKey].items) {
					itemHash[parentKey].items = [];
				}

				itemHash[parentKey].items.push(itemHash[key]);
			}
		});

		var tree = [];

		Object.keys(itemHash).forEach(function(key) {
			if (key.indexOf('.') === -1) {
				tree.push(itemHash[key]);
			}
		});

		return tree;
	}

	function getIntro(file, options, cb) {

		if (!file.intro) return cb();

		var introFile = grunt.file.expand(file.intro).shift();

		if (!introFile) return cb();

		getFileContentsAsHtml(introFile, cb);
	}

	function getItems(file, options, cb) {

		var files = grunt.file.expand(file.src);

		async.map(files, function(file, next) {

			getFileContentsAsHtml(file, function(error, html) {

				if (error) return next(error);

				var item = {
					file: file,
					content: html
				};

				next(null, item);
			});

		}, cb);
	}

	function getFileContentsAsHtml(file, cb) {

		try {
			var contents = grunt.file.read(file);
		} catch (error) {
			return cb(error);
		}

		var extension = getFileExtension(file);

		if (extension !== 'md') return cb(null, contents);

		marked(contents, cb);
	}
};
