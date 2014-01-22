'use strict';
var path = require('path'),
	async = require('async');

function AssetPacker(opts) {
	this.dest = opts.dest;
	this.packs = [];
	this.packFiles = opts.packFiles;

	this.init(opts.packFiles);
}

AssetPacker.prototype.init = function(packs) {
	var i, pack, framework, Compiler;

	for(i = 0; i < packs.length; i++) {
		pack = require(packs[i]);
		framework = pack.framework || 'simple';

		switch(framework) {
			case 'simple':
			case 'angular':
				Compiler = require('./compilers/' + framework);
				break;
			default:
				throw new Error('Unable to find compiler for ' + framework);
		}

		this.packs.push(new Compiler(pack, path.dirname(packs[i])));
	}
};

AssetPacker.prototype.compile = function(done) {
	var dest = this.dest,
		pack, i;

	async.each(this.packs, function(pack, cb) {
		pack.compile(dest, cb);
	}, done);
};

module.exports = AssetPacker;