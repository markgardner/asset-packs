var path = require('path'),
    util = require('util'),
    fs = require('fs'),
    istanbul = require('istanbul');

function PacksCoverageReporter(logger, helper, basePath) {
    var log = logger.create('packs-coverage');
    var collector = new istanbul.Collector();
    var finishWriting = function() {};
    var pendingFiles = 0;

    this.onBrowserComplete = function(browser, result) {
        collector.add(result.coverage);
    };

    this.onRunComplete = function(browsers) {
        var reportBaseDir = path.resolve(basePath, 'coverage');

        browsers.forEach(function(browser) {
            var reportDir = path.resolve(reportBaseDir, browser.name);

            pendingFiles++;

            helper.mkdirIfNotExists(reportDir, function() {
                var reporter;

                log.debug('Writing coverage to %s', reportDir);

                try {
                    reporter = istanbul.Report.create('html', {
                        dir: reportDir
                    });

                    reporter.writeReport(collector, true);
                } catch (e) {
                    log.error(e);
                }

                if(--pendingFiles === 0) {
                    finishWriting();
                }
            });
        });
    };

    this.onExit = function(done) {
        if(pendingFiles > 0) {
            finishWriting = done;
        } else {
            done();
        }
    };
}

PacksCoverageReporter.$inject = ['logger', 'helper', 'config.basePath'];

module.exports = PacksCoverageReporter;