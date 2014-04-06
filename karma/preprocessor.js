var path = require('path'),
	fs = require('fs'),
	AssetPacker = require('../lib/AssetPacker');

var assets = {};

function createPreprocessor(basePath, singleRun, reporters) {
	var useCoverage = reporters.indexOf('packs-coverage') !== -1;

	return function(content, file, done) {
		var packName = path.relative(basePath, file.path);
		packName = path.dirname(packName);

		if(!assets[packName]) {
			assets[packName] = new AssetPacker({
				pack: file.path,
				base: path.dirname(file.path),
				autoWatch: !singleRun,
				useCoverage: useCoverage
			});

			assets[packName].on('fileChange', function() {
				var now = Date.now();
				fs.utimesSync(file.path, now, now);
			});
		}

		assets[packName].getContent('js', function(content) {
			done(content.content);
		});
	};
}

createPreprocessor.$inject = ['config.basePath', 'config.singleRun', 'config.reporters'];

module.exports = createPreprocessor;