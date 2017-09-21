'use strict';

var getFileBaseName = require('../lib/getFileBaseName');

module.exports = function(item1, item2) {

	var file1 = item1.file;
	var file2 = item2.file;
	var docDir1 = getDocDir(file1);
	var docDir2 = getDocDir(file2);

	if (docDir1 === docDir2) {

		var isIntro1 = isIntro(file1);
		var isIntro2 = isIntro(file2);

		if (isIntro1 !== isIntro2) return isIntro1 ? -1 : 1;

		var isConstructor1 = isConstructorDoc(file1);
		var isConstructor2 = isConstructorDoc(file2);

		if (isConstructor1 !== isConstructor2) return isConstructor1 ? -1 : 1;

		var isPrototype1 = isPrototypeDoc(file1);
		var isPrototype2 = isPrototypeDoc(file2);

		if (isPrototype1 !== isPrototype2) return isPrototype1 ? -1 : 1;
	}

	// Sort by directory name (alphabetic).
	if (docDir1 !== docDir2) return docDir1 > docDir2 ? 1 : (docDir1 < docDir2 ? -1 : 0);

	var depth1 = file1.split('/').length;
	var depth2 = file2.split('/').length;

	// Sort by depth.
	if (depth1 !== depth2) return depth1 > depth2 ? 1 : (depth1 < depth2 ? -1 : 0);

	var basename1 = getFileBaseName(file1).toLowerCase();
	var basename2 = getFileBaseName(file2).toLowerCase();

	// Sort by filename (alphabetic).
	return basename1 > basename2 ? 1 : (basename1 < basename2 ? -1 : 0);
};

function getDocDir(file) {

	var docDir = file.substr(0, file.lastIndexOf('/')).toLowerCase();

	if (docDir.split('/').pop() === 'prototype') {
		return getDocDir(docDir);
	}

	return docDir;
}

function isIntro(file) {

	return getFileBaseName(file) === 'intro';
}

function isConstructorDoc(file) {

	return getFileBaseName(file) === 'constructor';
}

function isPrototypeDoc(file) {

	var parts = file.split('/');
	return parts[parts.length - 2] === 'prototype';
}
