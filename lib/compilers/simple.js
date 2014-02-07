'use strict';
var util = require('util'),
	path = require('path'),
	async = require('async');
var BaseCompiler = require('./base');

function SimpleCompiler(pack, path) {
	BaseCompiler.call(this, pack, path);
}

util.inherits(SimpleCompiler, BaseCompiler);

SimpleCompiler.prototype.generateContent = function(type, done) {
	var self = this;

	switch(type) {
		case 'js':
			this.generateJS(this.pack.js.files, this.pack.html.files, done);
			break;
	}
};

SimpleCompiler.prototype.generateJS = function(js, html, done) {
	var content = ['(function(window, document, undefined){'],
		rootDir = this.rootDir,
		name = this.name,
		generatedContent = this.generatedContent;

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
				content.push('// Template Helpers');
				content.push('var templateParts = {');

				for(i = 0; i < results.length; i++) {
					// Escape slashes and single quotes from file names.
					file = path.relative(rootDir, html[i]).replace(/(['\\])/g,'\\$1');

					// Escape whitespace and single quotes from content.
					cleanContent = results[i].replace(/'/g, "\\'").replace(/\s{2,}|\r*\n/g, ' ');

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

		generatedContent.js = {
			mime: 'text/javascript',
			content: content.join('\n')
		};

		done(generatedContent.js);
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