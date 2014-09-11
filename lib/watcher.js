var fs = require('fs'),
    path = require('path');

var watches = {},
    pendingEvents = {};

function addWatch(watchPath, handle) {
    // Add the fs.Watcher to the cache so we can close later.
    return watches[watchPath] = fs.watch(watchPath, { persistent: false }, function(type, filename) {
        // Ignore events with no filename or are tmp files.
        if(!filename || (/\.tmp$/i).test(filename)) {
            return;
        }

        // Add the full path to the filename.
        filename = path.join(watchPath, filename);

        // Clean windows seperators
        filename = filename.replace(/\\/g, '/');

        if(pendingEvents[filename]) {
            clearTimeout(pendingEvents[filename]);
        }

        function handleEvent() {
            // All changes go to heaven.
            if(type === 'change') {
                handle(type, filename);
            } else {
                // If the file exists then this was a create otherwise it was a delete.
                if(fs.existsSync(filename)) {
                    // Check if this is a directory. We will need to watch new directories
                    if(fs.statSync(filename).isDirectory()) {
                        addWatch(filename, handle);
                    }

                    handle('create', filename);
                } else {
                    // Check to see if this delete was a dir we are watching.
                    if(watches[filename]) {
                        watches[filename].close();
                        delete watches[filename];
                    }

                    handle('delete', filename);
                }
            }
        }

        pendingEvents[filename] = setTimeout(handleEvent, 100);
    });
}

module.exports = function(pathsToWatch, handle) {
    for(var i = 0, stat, watchPath; i < pathsToWatch.length; i++) {
        watchPath = pathsToWatch[i];
        stat = fs.statSync(pathsToWatch[i]);

        // Watch directories and not individual files.
        if(stat.isFile()) {
            watchPath = path.dirname(watchPath);
        }

        // Check to see if we are already watching this dir.
        if(!watches[watchPath]) {
            addWatch(watchPath, handle);
        }
    }
};

module.exports.closeAll = function() {
    var dirs = Object.keys(watches);

    for(var i = 0; i < dirs.length; i++) {
        watches[dirs[i]].close();
        delete watches[dirs[i]];
    }
};
