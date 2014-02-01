var util = require('util'),
	async = require('async');
var SimpleCompiler = require('./simple');

function AngularCompiler(pack, path) {
	SimpleCompiler.call(this, pack, path);
}

util.inherits(AngularCompiler, SimpleCompiler);

AngularCompiler.prototype.generateJS = function(js, html, done) {
	var content = ['(function(window, document, angular, undefined){'],
		appName = this.pack.appName + 'App',
		name = this.name,
		generatedContent = this.generatedContent;

	content.push('var ' + appName + ' = angular.module(\'' + appName + '\', ' + JSON.stringify(this.pack.appDeps || []) + ');');

	async.series([
		this.getFileContentsFunc(js, function(err, results, done) {
			for(var i = 0; i < results.length; i++) {
				content.push('// File: ' + js[i]);
				content.push(results[i]);
			}

			done();
		}),
		this.getFileContentsFunc(html, function(err, results, done) {
			var file, cleanContent, i;

			if(results.length) {
				content.push('// Template Defs');
				content.push(appName + '.run([\'$templateCache\', function($templateCache) {');

				for(i = 0; i < results.length; i++) {
					// Escape slashes and single quotes from file names.
					file = html[i].replace(/(['\\])/g,'\\$1');

					// Escape whitespace and single quotes from content.
					cleanContent = results[i].replace(/'/g, "\\'").replace(/\x3E[\s\n\r\t]+\x3C/g, "><");

					content.push("$templateCache.put('" + file + "','" + cleanContent + "');");
				}

				content.push('}]);');
			}

			done();
		})
	], function() {
		content.push('}(window, document, angular));');

		var debugContent = content.join('\n'),
			minContent = debugContent; // Change to use uglifyjs to minify

		generatedContent[name + '.js'] = debugContent;
		generatedContent[name + '.min.js'] = minContent;

		process.nextTick(done);
	});
};

module.exports = AngularCompiler;