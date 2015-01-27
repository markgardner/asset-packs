var path = require('path'),
    util = require('util'),
    fs = require('fs'),
    istanbul = require('istanbul');

function PacksCoverageReporter(logger, helper, basePath, reportConf) {
    var log = logger.create('packs-coverage');
    var collector = new istanbul.Collector();
    var finishWriting = function() {};
    var writingReport = false;

    reportConf = helper.merge({}, {
        reporters: ['html'],
        dir: 'coverage'
    }, reportConf);

    this.onBrowserComplete = function(browser, result) {
        collector.add(result.coverage);
    };

    this.onRunComplete = function(browsers) {
        var reportBaseDir = path.resolve(basePath, reportConf.dir);

        browsers.forEach(function(browser) {
            var reportDir = path.resolve(reportBaseDir, browser.name);

            writingReport = true;

            helper.mkdirIfNotExists(reportDir, function() {

                log.debug('Writing coverage to %s', reportDir);

                reportConf.reporters.forEach(function(type) {
                    try {
                        var reporter = istanbul.Report.create(type, {
                            dir: reportDir
                        });

                        reporter.writeReport(collector, true);
                    } catch (e) {
                        log.error('Error for type', type, e);
                    }
                });

                writingReport = false;

                finishWriting();
            });
        });
    };

    this.onExit = function(done) {
        if(writingReport) {
            finishWriting = done;
        } else {
            done();
        }
    };
}

PacksCoverageReporter.$inject = ['logger', 'helper', 'config.basePath', 'config.packsCoverage'];

module.exports = PacksCoverageReporter;