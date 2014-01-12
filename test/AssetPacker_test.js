'use strict';

var path = require('path'),
	should = require('should'),
	sinon = require('sinon');

var AssetPacker = require('../lib/AssetPacker');

describe('AssetPacker_test', function() {
	it('should exist', function() {
		should.exist(AssetPacker);

		AssetPacker.should.be.a.Function;
	})
});