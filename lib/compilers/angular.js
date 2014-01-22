var util = require('util');
var BaseCompiler = require('./base');

function AngularCompiler(pack, path) {
	BaseCompiler.call(this, pack, path);
}

util.inherits(AngularCompiler, BaseCompiler);

module.exports = AngularCompiler;