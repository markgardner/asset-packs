'use strict';
var fs = require('fs'),
	path = require('path'),
	async = require('async'),
	glob = require('glob'),
	util = require('util'),
	EventEmitter = require('events').EventEmitter;

function AssetPacker(opts) {
	EventEmitter.apply(this, arguments);

	if(!opts.base || !fs.existsSync(opts.base)) {
		throw new Error('Unable to find base ' + opts.base);
	}

	this.pack = opts.pack = require(path.join(process.cwd(), opts.pack));
	this.compiler = this.initCompiler(opts);
}
util.inherits(AssetPacker, EventEmitter);

AssetPacker.prototype.initCompiler = function(opts) {
	var Compiler, 
		framework = opts.pack.framework || 'simple';

	opts.watchHandle = this.emit.bind(this, 'fileChange');

	switch(framework) {
		case 'simple':
		case 'angular':
			Compiler = require('./compilers/' + framework);
			break;
		default:
			throw new Error('Unable to find compiler for ' + framework);
	}

	return new Compiler(opts);
};

AssetPacker.prototype.getContent = function(type, cb) {
	this.compiler.getContent(type, cb);
};

AssetPacker.prototype.getAllContent = function(cb) {
	this.compiler.getAllContent(cb);
};

module.exports = AssetPacker;