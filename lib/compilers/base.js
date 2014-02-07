'use strict';
var path = require('path'),
	async = require('async'),
	glob = require('glob'),
	fs = require('node-fs'),
	watch = require('../watcher');

function BaseCompiler(pack, rootDir, autoWatch) {
	this.pack = pack;
	this.rootDir = rootDir;
	this.name = path.basename(rootDir);
	this.fileContent = {};
	this.generatedContent = {};
	this.contentTypes = ['js'];
	this.autoWatch = autoWatch;

	pack.js = this.globFiles(pack.js, rootDir, 'js');
	pack.html = this.globFiles(pack.html, rootDir, 'js');
}

BaseCompiler.prototype = {
	getAllContent: function(cb) {
		var generatedContent = this.generatedContent;

		async.each(this.contentTypes, this.generateContent.bind(this), function() {
			cb(generatedContent);
		});
	},

	getContent: function(type, cb) {
		if(this.generatedContent[type]) {
			cb(this.generatedContent[type]);
		} else {
			this.generateContent(type, cb);
		}
	},

	globFiles: function(patterns, rootDir, generatedPath) {
		var generatedContent = this.generatedContent,
			fileContent = this.fileContent,
			globs = { patterns: patterns },
			autoWatch = this.autoWatch, lastWatches;

		function generateFileList() {
			var i, globPath,
				patterns = globs.patterns,
				newFiles = [];

			// Close any watches from last file list.
			if(lastWatches) {
				for(i = 0; i < lastWatches.length; i++) {
					lastWatches[i].close();
				}

				// Remove references.
				lastWatches = null;
			}

			// Glob the patterns and build the file list.
			for(i = patterns.length - 1; i >= 0; i--) {
				globPath = path.join(rootDir, patterns[i]);
				newFiles = newFiles.concat(glob.sync(globPath));
			}

			// Remove duplicates.
			for(i = newFiles.length - 1; i >= 0; i--) {
				if(newFiles.indexOf(newFiles[i]) !== i) {
					newFiles.splice(i, 1);
				}
			}

			globs.files = newFiles;

			if(autoWatch !== false) {
				// Setup watches that should invalidate caches on file changes.
				watch(newFiles, function(changeType, filePath) {
					var idx;

					if(changeType === 'change') {
						delete fileContent[filePath];
					} else if(changeType === 'delete') {
						delete fileContent[filePath];

						// Remove the file from the file list. I'm assumming that watchr will close the watch.
						idx = globs.files.indexOf(filePath);
						if(idx !== -1) {
							globs.files.splice(idx, 1);
						}
					} else {
						// Regenerate the file list. Since we aren't sure on the file position in the new list redoing
						// the list will ensuring generated files are consistent.
						generateFileList();
					}

					delete generatedContent[generatedPath];
				});
			}
		}

		generateFileList();

		return globs;
	},

	getFileContents: function(files, contentCB) {
		var fileContent = this.fileContent;

		return function(seriesCB) {
			async.map(files, function(file, cb) {
				if(fileContent[file]) {
					cb(null, fileContent[file]);
				} else {
					fs.readFile(file, 'utf8', function(err, content) {
						fileContent[file] = content;

						cb(err, content);
					});
				}
			}, function(err, results) {
				contentCB(err, results, seriesCB);
			});
		};
	},

	cleanTemplate: function(contentStr) {
		return (contentStr || '').replace(/'/g, "\\'").replace(/\s{2,}|\r*\n/g, ' ');
	}
};

module.exports = BaseCompiler;