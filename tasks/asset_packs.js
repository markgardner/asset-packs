'use strict';

var path = require('path'),
    async = require('async'),
    fs = require('node-fs'),
    AssetPacker = require('../lib/AssetPacker');

module.exports = function(grunt) {
    grunt.registerMultiTask('packs', 'Grunt Plugin for writing packs to disk', function() {
        var outputDir = path.resolve(this.data.dest),
            done = this.async(),
            packs = [];

        for(var list = this.filesSrc, i = 0; i < list.length; i++) {
            packs.push(new AssetPacker({
                pack: path.resolve(list[i]),
                base: path.dirname(list[i]),
                autoWatch: false
            }));
        }

        async.each(packs, function(pack, done) {
            pack.getAllContent(function(content) {
                for(var p in content) {
                    var filename = path.resolve(outputDir, pack.compiler.base + '.' + p);
                    var dirname = path.dirname(filename);

                    if(!fs.existsSync(dirname)) {
                        fs.mkdirSync(dirname, 511 /* 0777 */, true);
                    }

                    fs.writeFile(filename, content[p].content);
                }

                done();
            });
        }, done);
    });
};