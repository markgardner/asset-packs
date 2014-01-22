var path = require('path'),
	fs = require('node-fs');

function BaseCompiler(pack, rootDir) {
	this.css = pack.css;
	this.js = pack.js;
	this.template = pack.template;
	this.rootDir = rootDir;
}

BaseCompiler.prototype = {
	compile: function(destDir, cb) {
		var self = this,
			name = path.basename(self.rootDir),
			file, i;

		fs.mkdir(path.join(destDir, name), 0777, true, function(err) {
			process.nextTick(cb);
		});
	}
};

module.exports = BaseCompiler;