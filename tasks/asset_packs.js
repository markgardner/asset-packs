'use strict';

var path = require('path'),
    AssetPacker = require('../lib/AssetPacker');

module.exports = function(grunt) {
  grunt.registerMultiTask(module.exports.task, module.exports.desc, module.exports.handle(grunt));
};

module.exports.task = 'asset_packs';
module.exports.desc = 'Grunt Plugin for packing development source into production assets';
module.exports.handle = function(grunt) {
  return function() {
    var packFiles = [],
        options = this.options(),
        done = this.async(),
        packer;

    this.files.forEach(function(file) {
      packFiles = packFiles.concat(file.src);
    });

    packFiles = packFiles.map(function(file) {
      return path.resolve(file);
    });

    options.dest = path.resolve(options.dest);
    options.packFiles = packFiles;

    packer = new AssetPacker(options);
    packer.compile(done);

    return packer;
  };
};