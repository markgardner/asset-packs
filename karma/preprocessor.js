var path = require('path'),
	fs = require('fs'),
	AssetPacker = require('../lib/AssetPacker');

var assets = {};

function createPreprocessor(basePath, singleRun, reporters) {
	var useCoverage = reporters.indexOf('packs-coverage') !== -1;

	return function(content, file, done) {
		var packPath = path.relative(basePath, file.path),
			packName = path.dirname(packPath);

		if(!assets[packName]) {
			assets[packName] = new AssetPacker({
				pack: packPath,
				base: path.dirname(file.path),
				autoWatch: !singleRun,
				useCoverage: useCoverage
			});

			assets[packName].on('fileChange', function() {
				var now = new Date();
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