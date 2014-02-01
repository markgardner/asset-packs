var util = require('util'),
	async = require('async');
var BaseCompiler = require('./base');

function SimpleCompiler(pack, path) {
	BaseCompiler.call(this, pack, path);
}

util.inherits(SimpleCompiler, BaseCompiler);

SimpleCompiler.prototype.generateContent = function(done) {
	var self = this;

	async.series([
		this.generateJS.bind(this, this.pack.js, this.pack.html),
		this.generateCSS.bind(this, this.pack.css)
	], done);
};

SimpleCompiler.prototype.generateJS = function(js, html, done) {
	var content = ['(function(window, document, undefined){'],
		name = this.name,
		generatedContent = this.generatedContent;

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
				content.push('// Template Helpers');
				content.push('var templateParts = {');

				for(i = 0; i < results.length; i++) {
					// Escape slashes and single quotes from file names.
					file = html[i].replace(/(['\\])/g,'\\$1');

					// Escape whitespace and single quotes from content.
					cleanContent = results[i].replace(/'/g, "\\'").replace(/\x3E[\s\n\r\t]+\x3C/g, "><");

					content.push("'" + file + "':'" + cleanContent + "'" + (i + 1 < results.length ? ',' : ''));
				}

				content.push('}, parent = document.createElement(\'div\');');
				content.push('function getTemplate(name) {');
				content.push('  parent.innerHTML = templateParts[name];');
				content.push('  return parent.childNodes;');
				content.push('}');
			}

			done();
		})
	], function() {
		content.push('}(window, document));');

		var debugContent = content.join('\n'),
			minContent = debugContent; // Change to use uglifyjs to minify

		generatedContent[name + '.js'] = debugContent;
		generatedContent[name + '.min.js'] = minContent;

		process.nextTick(done);
	});
};

SimpleCompiler.prototype.generateCSS = function(css, done) {
	var name = this.name,
		generatedContent = this.generatedContent;

	this.getFileContents(css, function(err, results) {
		var debugContent = [],
			minContent,
			i;

		for(i = 0; i < results.length; i++) {
			debugContent.push('/* File: ' + css[i] + ' */');
			debugContent.push(results[i]);
		}

		debugContent = debugContent.join('\n');
		minContent = debugContent; // Change to use uglifyjs to minify

		generatedContent[name + '.css'] = debugContent;
		generatedContent[name + '.min.css'] = minContent;

		process.nextTick(done);
	});
};

module.exports = SimpleCompiler;