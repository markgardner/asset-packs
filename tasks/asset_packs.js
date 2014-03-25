'use strict';

var path = require('path'),
    cypto = require('crypto'),
    async = require('async'),
    fs = require('node-fs'),
    AssetPacker = require('../lib/AssetPacker');

function generateSha(content) {
    var shasum = cypto.createHash('sha1');

    shasum.update(content);

    return shasum.digest('hex');
}

module.exports = function(grunt) {
    grunt.registerMultiTask('packs', 'Grunt Plugin for writing packs to disk', function() {
        var outputDir = path.resolve(this.data.dest),
            done = this.async(),
            packs = [],
            manifest = {};

        if(!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, 511 /* 0777 */, true);
        }

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
                    var fileContent = content[p].content;
                    var fileSha = generateSha(fileContent);
                    var filename = pack.compiler.name + '-' + fileSha + '.' + p;
                    var filePath = path.resolve(outputDir, filename);

                    fs.writeFile(filePath, fileContent);
                    
                    if(!manifest[pack.compiler.base]) {
                        manifest[pack.compiler.base] = {};
                    }

                    manifest[pack.compiler.base][p] = filename;
                }

                done();
            });
        }, function() {
            fs.writeFile(path.resolve(outputDir, 'manifest.json'), JSON.stringify(manifest), done);
        });
    });
};