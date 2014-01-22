var path = require('path'),
	async = require('async'),
	fs = require('node-fs');

function BaseCompiler(pack, rootDir) {
	this.pack = pack;
	this.rootDir = rootDir;
	this.name = path.basename(rootDir);
	this.fileContent = {};
	this.generatedContent = {};
}

BaseCompiler.prototype = {
	compile: function(baseDestDir, cb) {
		var self = this;

		fs.mkdir(baseDestDir, 0777, true, function(err) {
			self.generateContent(function(err) {
				var contents = self.generatedContent, 
					file,
					filePath;

				if(err) {
					throw err;
				}

				for(file in contents) {
					filePath = path.join(baseDestDir, file);

					fs.writeFileSync(filePath, contents[file] || '');
				}

				cb();
			});
		});
	},

	getFileContentsFunc: function(files, contentCB) {
		var self = this;

		// Return a function for async to use as a task.
		return function(asyncCB) {
			self.getFileContents(files, function(err, results) {
				// The content callback must call the asyncDone to allow the control flow to continue.
				contentCB(err, results, asyncCB);
			});
		};
	},

	getFileContents: function(files, done) {
		var cache = this.fileContent,
			rootDir = this.rootDir;

		// Map the contents of the files with lazy loading from cache.
		// Use series map to prevent running out of FD's.
		async.mapSeries(files || [], function(file, done) {
			if(cache[file]) {
				process.nextTick(function() {
					done(null, cache[file]);
				});
			} else {
				fs.readFile(path.join(rootDir, file), 'utf8', function(err, content) {
					// Store contents in cache.
					cache[file] = content;

					done(err, content);
				});
			}
		}, done);
	}
};

module.exports = BaseCompiler;