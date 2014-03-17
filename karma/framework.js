var fs = require('fs'),
    path = require('path'),
    AssetPacker = require('../lib/AssetPacker');

var files = [];

function createAsset(pack) {
    new AssetPacker({
        pack: pack,
        base: path.dirname(pack),
        sync: true
    }).getContent('js', function(content) {
        fs.writeFileSync(pack + '.js', content.content);
    });
}

function replacePacks(lists) {
    for(var i = 0; i < lists.length; i++) {
        if(lists[i].pattern.match(/pack\.json$/)) {
            createAsset(lists[i].pattern);

            lists[i].pattern += '.js';
            files.push(lists[i].pattern);
        }
    }
}

function createFramework(config) {
    replacePacks(config.files);

    // Gotta support karma-sets.
    if(config.sets) {
        for(var p in config.sets) {
            replacePacks(config.sets[p]);
        }
    }

    // Can't use emitter.on('exit'). We will get the event raised before coverage is done.
    process.on('exit', function() {
        for(var i = 0; i < files.length; i++) {
            if(fs.existsSync(files[i])) {
                fs.unlinkSync(files[i]);
            }
        }
    });
}

module.exports = createFramework;