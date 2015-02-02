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
            chunk = null;
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

function configureProd(opts) {
    var manifest = require(path.join(process.cwd(), opts.base, 'manifest.json'));

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

            file = opts.prefix + manifest[file][type];

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

function configureDev(opts) {
    var assets = {},
        regex = new RegExp('^' + opts.prefix+ '(.+)');

    async.concat(opts.files || [], function(pattern, cb) {
        glob(path.join(opts.base, pattern), cb);
    }, function(err, packFiles) {
        var packName,
            packPath;

        for(var i = 0; i < packFiles.length; i++) {
            packPath = path.relative(opts.base, packFiles[i]);

            // Remove pack.json file.
            packName = path.dirname(packPath);

            // Clean windows path
            packName = packName.replace(/\\/g, '/');

            assets[packName] = new AssetPacker({
                pack: packPath,
                base: path.join(opts.base, packName),
                sync: opts.sync,
                autoWatch: opts.autoWatch,
                skipCache: opts.skipCache
            });
        }
    });

    return function(req, res, next) {
        var match = req.url.match(regex), dir, file, ext, asset;
        
        if(match) {
            dir = path.dirname(match[1]);
            ext = path.extname(match[1]);
            file = path.basename(match[1], ext);
            file = path.join(dir, file);

            // Fix windows path
            file = file.replace(/\\/g, '/');

            asset = assets[file];

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

                    // Look for chunk to support dust templates
                    if(chunk) {
                        return chunk.setError(err);
                    } else {
                        throw err;
                    }
                }

                file = opts.prefix + file + '.' + type;

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

module.exports = function(opts) {
    if(opts.isProduction) {
        return configureProd(opts);
    } else {
        return configureDev(opts);
    }
};
