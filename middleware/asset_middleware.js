'use strict';
var glob = require('glob'),
    path = require('path'),
	async = require('async'),
    AssetPacker = require('../lib/AssetPacker');

module.exports = function(basePath, packFiles) {
    var assets = {};

    async.concat(packFiles, function(pattern, cb) {
        glob(path.join(basePath, pattern), cb);
    }, function(err, packFiles) {
        var packName;

        for(var i = 0; i < packFiles.length; i++) {
            packName = path.relative(basePath, packFiles[i]);
            packName = packName.slice(0, packName.length - 10);

            assets[packName] = new AssetPacker({
                pack: packFiles[i],
                base: path.join(basePath, packName)
            });
        }
    });

	return function(req, res, next) {
        var match = req.url.match(/^\/packs\/(.+)/), dir, file, ext, asset;
        
        if(match) {
            dir = path.dirname(match[1]);
            ext = path.extname(match[1]);
            file = path.basename(match[1], ext);
            asset = assets[path.join(dir, file)];

            asset.getContent(ext.slice(1), function(content) {
                res.writeHead(200, {
                    'Content-Type': content.mime
                });
                res.end(content.content);
            });
        } else {
            // Setup helper method to resolve dev/prod versions of packs.
            res.locals.pack = function(packer) {

            };

            next();
        }
	};
};