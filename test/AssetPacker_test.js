'use strict';

var path = require('path'),
	should = require('should'),
	sinon = require('sinon');

var AssetPacker = require('../lib/AssetPacker'),
 	AngularCompiler = require('../lib/compilers/angular'),
 	SimpleCompiler = require('../lib/compilers/simple');

describe('AssetPacker_test', function() {
	var packer;

	beforeEach(function() {
		packer = new AssetPacker({
			packFiles: [
				path.join(__dirname, 'packs/test1/pack.json'),
				path.join(__dirname, 'packs/test2/pack.json')
			],
			dest: path.resolve(__dirname,'../.build')
		});

		sinon.spy(AngularCompiler.prototype, 'compile');
		sinon.spy(SimpleCompiler.prototype, 'compile');
	});

	afterEach(function() {
		AngularCompiler.prototype.compile.restore();
		SimpleCompiler.prototype.compile.restore();
	});

	it('should exist', function() {
		should.exist(AssetPacker);

		AssetPacker.should.be.a.Function;
	});

	// init
	it('should build compilers that match the correct framework on init', function() {
		packer.packs.length.should.equal(2);

		packer.packs[0].should.be.instanceof(AngularCompiler);
		packer.packs[1].should.be.instanceof(SimpleCompiler);
	});

	// compile
	it('should call compile on both packs', function(done) {
		packer.compile(function() {
			packer.packs[0].compile.calledOnce.should.be.true;
			packer.packs[1].compile.calledOnce.should.be.true;

			done();
		});
	});
});