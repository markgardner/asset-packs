'use strict';
var util = require('util'),
	path = require('path'),
	async = require('async'),
	istanbul = require('istanbul');
var SimpleCompiler = require('./simple');

function AngularCompiler(opts) {
	SimpleCompiler.apply(this, arguments);
}

util.inherits(AngularCompiler, SimpleCompiler);

AngularCompiler.prototype.generateJS_Params = function() {
	return [
		'window:window',
		'document:document',
		'angular:angular',
		'undefined:undefined'
	];
};

AngularCompiler.prototype.generateJS_Header = function() {
	var header = [],
		appName = this.pack.appName || this.pack.name;

	if(this.pack.useStrict) {
		header.push('"use strict";');
	}

	header.push('var ' + appName + ' = angular.module(\'' + appName + '\', ' + JSON.stringify(this.pack.dependencies || []) + ');');

	return header.join('\n');
};

AngularCompiler.prototype.generateJS_Footer = function(views) {
	var footer = [],
		viewFiles = Object.keys(views),
		appName = this.pack.appName || this.pack.name;

	if(viewFiles.length) {
		footer.push('// Template Defs');
		footer.push(appName + '.run([\'$templateCache\', function($templateCache) {');

		for(var i = 0; i < viewFiles.length; i++) {
			footer.push("$templateCache.put('" + viewFiles[i] + "','" + views[viewFiles[i]] + "');");
		}

		footer.push('}]);');
	}

	return footer.join('\n');
};

module.exports = AngularCompiler;