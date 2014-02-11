var path = require('path'),
	AssetPacker = require('../lib/AssetPacker');

var assets = {};

function createPreprocessor(basePath) {
	return function(content, file, done) {
		var packName = path.relative(basePath, file.path);
		packName = path.dirname(packName);

		if(!assets[packName]) {
			assets[packName] = new AssetPacker({
				pack: file.path,
				base: path.dirname(file.path)
			});
		}

		assets[packName].getContent('js', function(content) {
			done(content.content);
		});
	};
}

createPreprocessor.$inject = ['config.basePath'];

module.exports = {
	'preprocessor:packs': ['factory', createPreprocessor]
};