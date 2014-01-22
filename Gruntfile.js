'use strict';

module.exports = function(grunt) {
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'lib/**/*.js',
        'tasks/*.js'
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
        node: true
      }
    },

    clean: {
      asset_packs: ['.build']
    },

    // Configuration to be run (and then tested).
    asset_packs: {
      compile: {
        src: ['test/packs/**/pack.json'],
        options: {
          dest: '.build'
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
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.registerTask('test', ['clean', 'jshint', 'mochaTest']);
  grunt.registerTask('default', ['asset_packs']);
};
