'use strict';

var path = require('path'),
	should = require('should'),
	sinon = require('sinon');

var asset_packs = require('../tasks/asset_packs'),
	AssetPacker = require('../lib/AssetPacker');

describe('asset_packs_test', function() {
	beforeEach(function() {
		sinon.spy(AssetPacker.prototype, 'init');
		sinon.stub(AssetPacker.prototype, 'compile', function(done) {
			process.nextTick(done);
		});
	});

	afterEach(function() {
		AssetPacker.prototype.init.restore();
		AssetPacker.prototype.compile.restore();
	});

	it('registers itself with grunt', function() {
		var gruntMock = {
			registerMultiTask: sinon.spy()
		};

		asset_packs(gruntMock);

		gruntMock.registerMultiTask.calledOnce.should.be.true;
		gruntMock.registerMultiTask.calledWith(asset_packs.task, asset_packs.desc, sinon.match.func).should.be.true;
	});

	it('configures AssetPacker correctly', function(done) {
		var handle = asset_packs.handle(),
			options = {
				dest: 'tmp'
			},
			gruntMock = {
				async: sinon.stub().returns(assertAway),
				options: sinon.stub().returns(options),
				files: [{
					src: ['test/packs/test1/pack.json','test/packs/test2/pack.json']
				}]
			},
			packer;

		// Emulate calling the task
		packer = handle.call(gruntMock);

		// This method will be called by compile stub.
		function assertAway() {
			// Check init properties
			packer.packFiles.should.be.an.Array;
			packer.packFiles[0].should.equal(path.resolve(gruntMock.files[0].src[0]));
			packer.packFiles[1].should.equal(path.resolve(gruntMock.files[0].src[1]));
			packer.dest.should.equal(path.resolve(options.dest));

			// Make sure task functiosn were called
			packer.init.calledOnce.should.be.true;
			packer.compile.calledOnce.should.be.true;

			done();
		}
	})
});