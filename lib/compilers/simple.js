'use strict';
var util = require('util'),
	path = require('path'),
	async = require('async'),
	istanbul = require('istanbul');
var BaseCompiler = require('./base');

function SimpleCompiler(opts) {
	BaseCompiler.apply(this, arguments);
}

util.inherits(SimpleCompiler, BaseCompiler);

SimpleCompiler.prototype.generateContent = function(type, done) {
	switch(type) {
		case 'js':
			this.generateJS(this.pack.js.files, this.pack.html.files, done);
			break;
	}
};

SimpleCompiler.prototype.generateJS_Params = function() {
	if(this.pack.noClosure) {
		return [];
	}

	return [
		'window:window',
		'document:document',
		'undefined:undefined'
	];
};

SimpleCompiler.prototype.generateJS_Header = function() {
	if(this.pack.useStrict) {
		return '"use strict";';
	}

	return '';
};

SimpleCompiler.prototype.generateJS_Footer = function(views) {
	var footer = [],
		viewFiles = Object.keys(views);

	if(viewFiles.length) {
		footer.push('// Template Helpers');
		footer.push('var templateParts = {');

		for(var i = 0; i < viewFiles.length; i++) {
			footer.push("'" + viewFiles[i] + "':'" + views[viewFiles[i]] + "'" + (i + 1 < viewFiles.length ? ',' : ''));
		}

		footer.push('}, parent = document.createElement(\'div\');');
		footer.push('function getTemplate(name) {');
		footer.push('  parent.innerHTML = templateParts[name];');
		footer.push('  return parent.childNodes;');
		footer.push('}');
	}

	return footer.join('\n');
};

SimpleCompiler.prototype.generateJS = function(js, html, done) {
	var self = this,
		generatedContent = this.generatedContent,
		instrumenter = this.useCoverage ? new istanbul.Instrumenter() : null,
		meta = { header: '', files: {}, footer: '' };

	meta.header = this.generateJS_Header();
	meta.params = this.generateJS_Params();

	async.series([
		this.getFileContents(js, function(err, results, done) {
			var filename, file;

			for(var i = 0; i < results.length; i++) {
				filename = path.relative(self.base, js[i]);

				if(instrumenter) {
					file = instrumenter.instrumentSync(results[i], js[i]);
				} else {
					file = results[i];
				}

				meta.files[filename] = file;
			}

			done();
		}),
		this.getFileContents(html, function(err, results, done) {
			var files = {}, file;

			for(var i = 0; i < results.length; i++) {
				// Escape single quotes from file names.
				file = path.relative(self.base, html[i]).replace(/(')/g,'\\$1');

				// Fix windows path seperators
				file = file.replace(/\\/g, '/');

				files[file] = self.cleanTemplate(results[i]);
			}


			meta.footer = self.generateJS_Footer(files);

			done();
		})
	], function() {
		var content = [],
			files = Object.keys(meta.files),
			hasParams = meta.params.length > 0,
			paramNames = meta.params.map(function(i) { return i.slice(0, i.lastIndexOf(':')); }),
			paramValues = meta.params.map(function(i) { return i.slice(i.lastIndexOf(':') + 1); });

		if(hasParams) {
			content.push('(function(' + paramNames.join(',') + '){');
		}

		content.push(meta.header);

		for(var i = 0; i < files.length; i++) {
			content.push('// File: ' + files[i]);
			content.push(meta.files[files[i]]);
		}

		content.push(meta.footer);

		if(hasParams) {
			content.push('}(' + paramValues.join(',') + '))');
		}

		generatedContent.js = {
			mime: 'text/javascript',
			meta: meta,
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