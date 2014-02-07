'use strict';
var fs = require('fs'),
	path = require('path'),
	async = require('async'),
	glob = require('glob');

function AssetPacker(opts) {
	if(!opts.base || !fs.existsSync(opts.base)) {
		throw new Error('Unable to find base ' + opts.base);
	}

	this.pack = require(opts.pack);
	this.compiler = this.initCompiler(this.pack, opts.base);
}

AssetPacker.prototype.initCompiler = function(pack, base) {
	var Compiler, 
		framework = pack.framework || 'simple';

	switch(framework) {
		case 'simple':
		case 'angular':
			Compiler = require('./compilers/' + framework);
			break;
		default:
			throw new Error('Unable to find compiler for ' + framework);
	}

	return new Compiler(pack, base);
};

AssetPacker.prototype.getContent = function(type, cb) {
	this.compiler.getContent(type, cb);
};

module.exports = AssetPacker;