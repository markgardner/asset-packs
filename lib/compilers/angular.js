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

AngularCompiler.prototype.generateJS = function(js, html, done) {
	var content = ['(function(window, document, angular, undefined){'],
		appName = this.pack.appName || this.pack.name,
		cleanTemplate = this.cleanTemplate,
		baseDir = this.base,
		generatedContent = this.generatedContent,
		instrumenter = this.useCoverage ? new istanbul.Instrumenter() : null;

	if(this.pack.useStrict) {
		content.unshift('\'use strict\';');
	}

	content.push('var ' + appName + ' = angular.module(\'' + appName + '\', ' + JSON.stringify(this.pack.dependencies || []) + ');');

	async.series([
		this.getFileContents(js, function(err, results, done) {
			for(var i = 0; i < results.length; i++) {
				content.push('// File: ' + path.relative(baseDir, js[i]));

				if(instrumenter) {
					content.push(instrumenter.instrumentSync(results[i], js[i]));
				} else {
					content.push(results[i]);
				}
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
					file = path.relative(baseDir, html[i]).replace(/(['\\])/g,'\\$1');

					// Escape whitespace and single quotes from content. This might cause issues with pre tags.
					cleanContent = cleanTemplate(results[i]);

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