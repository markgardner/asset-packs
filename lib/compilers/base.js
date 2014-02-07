'use strict';
var path = require('path'),
	async = require('async'),
	glob = require('glob'),
	fs = require('node-fs');

function BaseCompiler(pack, rootDir) {
	this.pack = pack;
	this.rootDir = rootDir;
	this.name = path.basename(rootDir);
	this.fileContent = {};
	this.generatedContent = {};

	this.globFiles(pack.js, rootDir);
	this.globFiles(pack.html, rootDir);
}

BaseCompiler.prototype = {
	getContent: function(type, cb) {
		if(this.generatedContent[type]) {
			cb(this.generatedContent[type]);
		} else {
			this.generateContent(type, cb);
		}
	},

	globFiles: function(files, rootDir) {
		var newFiles, i;
		for(i = files.length - 1; i >= 0; i--) {
			newFiles = glob.sync(path.join(rootDir, files[i]));
			newFiles.unshift(1);
			newFiles.unshift(i);

			files.splice.apply(files, newFiles);
		}

		// Remove duplicates
		for(i = files.length - 1; i >= 0; i--) {
			if(files.indexOf(files[i]) !== i) {
				files.splice(i, 1);
			}
		}
	},

	getFileContents: function(files, contentCB) {
		var fileContent = this.fileContent;

		return function(seriesCB) {
			async.map(files, function(file, cb) {
				fs.readFile(file, 'utf8', function(err, content) {
					fileContent[file] = content;

					cb(err, content);
				});
			}, function(err, results) {
				contentCB(err, results, seriesCB);
			});
		};
	}
};

module.exports = BaseCompiler;