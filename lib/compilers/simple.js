var util = require('util');
var BaseCompiler = require('./base');

function SimpleCompiler(pack, path) {
	BaseCompiler.call(this, pack, path);
}

util.inherits(SimpleCompiler, BaseCompiler);

module.exports = SimpleCompiler;