'use strict';

var path = require('path'),
    cypto = require('crypto'),
    async = require('async'),
    fs = require('node-fs'),
    AssetPacker = require('../lib/AssetPacker'),
    UglifyJS = require("uglify-js");

function generateSha(content) {
    var shasum = cypto.createHash('sha1');

    shasum.update(content);

    return shasum.digest('hex');
}

var fileHandlers = {
    js: function(contents, pack, outputDir) {
        var fileSha = generateSha(contents.content),
            filename = pack.compiler.name + '-' + fileSha,
            sourceMap = UglifyJS.SourceMap({
                file: filename + '.js.map'
            }),
            compressor = UglifyJS.Compressor({ 
                warnings: false
            }),
            toplevel = UglifyJS.parse(contents.content, {
                filename: filename + '.js',
                toplevel: null
            }),
            stream = UglifyJS.OutputStream({
                source_map: sourceMap
            });

        toplevel.figure_out_scope();
        toplevel = toplevel.transform(compressor);
        toplevel.print(stream);

        fs.writeFile(path.resolve(outputDir, filename + '.js'), contents.content);
        fs.writeFile(path.resolve(outputDir, filename + '.min.js'), stream + '\n//@ sourceMappingURL=' + filename + '.js.map');
        fs.writeFile(path.resolve(outputDir, filename + '.js.map'), sourceMap + '');

        return filename + '.min.js';
    }
};

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
                pack: list[i],
                base: path.dirname(list[i]),
                autoWatch: false
            }));
        }

        async.each(packs, function(pack, done) {
            pack.getAllContent(function(content) {
                var filename, p;

                for(p in content) {
                    filename = fileHandlers[p](content[p], pack, outputDir);
                    
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