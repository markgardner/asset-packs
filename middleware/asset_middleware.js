'use strict';
var glob = require('glob'),
    path = require('path'),
	async = require('async'),
    AssetPacker = require('../lib/AssetPacker');

function createHelper(handler) {
    return function(chunk, context, bodies, params) {
        var file, type;

        // Dustjs has a different way of doing function calls. Allow for dustjs, ejs & jade.
        if(typeof(chunk) === 'string') {
            file = chunk;
            type = context;
        } else {
            file = params.file;
            type = params.type;
        }

        if(!file) {
            throw new Error('File parameter was not specified');
        }

        if(!type) {
            throw new Error('Type parameter was not specified');
        }

        return handler(file, type, chunk);
    };
}

function configureProd(urlPrefix, basePath) {
    var manifest = require(path.join(basePath, 'manifest.json'));

    return function(req, res, next) {
        // Setup helper method for prod packs.
        res.locals.pack = createHelper(function(file, type, chunk) {
            var err;

            if(!manifest[file]) {
                err = new Error('Pack was not found \'' + file + '\'');

                if(chunk) {
                    return chunk.setError(err);
                } else {
                    throw err;
                }
            }

            file = urlPrefix + manifest[file][type];

            // Dust will give use a chunk to write others will just work with returned value.
            if(chunk) {
                chunk.write(file);
            } else {
                return file;
            }
        });

        next();
    };
}

function configureDev(urlPrefix, basePath, packFiles) {
    var assets = {},
        regex = new RegExp('^' + urlPrefix+ '(.+)');

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
        var match = req.url.match(regex), dir, file, ext, asset;
        
        if(match) {
            dir = path.dirname(match[1]);
            ext = path.extname(match[1]);
            file = path.basename(match[1], ext);
            asset = assets[path.join(dir, file)];

            if(asset) {
                asset.getContent(ext.slice(1), function(content) {
                    res.writeHead(200, {
                        'Content-Type': content.mime
                    });
                    res.end(content.content);
                });
            } else {
                next();
            }
        } else {
            // Setup helper method for dev packs.
            res.locals.pack = createHelper(function(file, type, chunk) {
                var err;

                if(!assets[file]) {
                    err = new Error('Pack was not found \'' + file + '\'');

                    if(chunk) {
                        return chunk.setError(err);
                    } else {
                        throw err;
                    }
                }

                file = urlPrefix + file + '.' + type;

                // Dust will give use a chunk to write others will just work with returned value.
                if(chunk) {
                    chunk.write(file);
                } else {
                    return file;
                }
            });

            next();
        }
    };
}

module.exports = function(urlPrefix, basePath, packFiles) {
    if(process.env.NODE_ENV === 'production') {
        return configureProd(urlPrefix, basePath);
    } else {
        return configureDev(urlPrefix, basePath, packFiles);
    }
};