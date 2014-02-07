'use strict';
var util = require('util'),
	path = require('path'),
	async = require('async');
var SimpleCompiler = require('./simple');

function AngularCompiler(pack, path) {
	SimpleCompiler.call(this, pack, path);
}

util.inherits(AngularCompiler, SimpleCompiler);

AngularCompiler.prototype.generateJS = function(js, html, done) {
	var content = ['(function(window, document, angular, undefined){'],
		appName = this.pack.appName + 'App',
		rootDir = this.rootDir,
		generatedContent = this.generatedContent;

	content.push('var ' + appName + ' = angular.module(\'' + this.pack.appName + '\', ' + JSON.stringify(this.pack.appDeps || []) + ');');

	async.series([
		this.getFileContents(js, function(err, results, done) {
			for(var i = 0; i < results.length; i++) {
				content.push('// File: ' + path.relative(rootDir, js[i]));
				content.push(results[i]);
			}

			done();
		}),
		this.getFileContents(html, function(err, results, done) {
			var file, cleanContent, i;

			if(results.length) {
				content.push('// Template Defs');
				content.push(appName + '.run([\'$templateCache\', function($templateCache) {');

				for(i = 0; i < results.length; i++) {
					// Escape slashes and single quotes from file names.
					file = path.relative(rootDir, html[i]).replace(/(['\\])/g,'\\$1');

					// Escape whitespace and single quotes from content. This might cause issues with pre tags.
					cleanContent = results[i].replace(/'/g, "\\'").replace(/\s{2,}|\r*\n/g, ' ');

					content.push("$templateCache.put('" + file + "','" + cleanContent + "');");
				}

				content.push('}]);');
			}

			done();
		})
	], function() {
		content.push('}(window, document, angular));');

		generatedContent.js = {
			mime: 'text/javascript',
			content: content.join('\n')
		};

		done(generatedContent.js);
	});
};

module.exports = AngularCompiler;