'use strict';

module.exports = function(grunt) {
	grunt.initConfig({
	jshint: {
		all: [
			'lib/**/*.js',
			'middleware/**/*.js',
			'tasks/*.js',
			'test/**/*.js',
			'Gruntfile.js'
		],
		options: {
			curly: true,
			eqeqeq: true,
			immed: true,
			latedef: true,
			newcap: true,
			noarg: true,
			sub: true,
			undef: true,
			boss: true,
			eqnull: true,
			node: true,
			globals: {
				describe: false,
				it: false,
				before: false,
				beforeEach: false,
				after: false,
				afterEach: false
			}
		}
	},

	// Unit tests.
	mochaTest: {
		test: {
			src: ['test/*_test.js']
		}
	},

	watch: {
		tests: {
			files: ['test/*_test.js','lib/**/*'],
			tasks: ['test']
		}
	}
	});

	grunt.loadTasks('tasks');

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-mocha-test');

	grunt.registerTask('test', ['jshint', 'mochaTest']);
	grunt.registerTask('default', ['test']);
};
