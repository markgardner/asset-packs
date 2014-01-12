'use strict';

function AssetPacker(opts) {
	this.packFiles = opts.packFiles;
	this.dest = opts.dest;

	this.init();
}

AssetPacker.prototype.init = function() {
	
}

AssetPacker.prototype.compile = function(done) {
	process.nextTick(done);
}

module.exports = AssetPacker;