module.exports = function(grunt) {
  'use strict';

  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    watch: {
      test: {
        files: ['src/**/*.js', 'test/spec/**/*.js'],
        tasks: ['test']
      }
    },

    jshint: {
      options: {
        jshintrc: true,
        reporter: require('jshint-stylish')
      },
      gruntfile: ['Gruntfile.js'],
      src: ['src/**/*.js'],
      spec: ['test/spec/**/*.js']
    },

    karma: {
      specWatch: {
        configFile: 'karma.conf.js'
      },
      spec: {
        configFile: 'karma.conf.js',
        singleRun: true,
        autoWatch: false
      },
    }
  });

  grunt.registerTask('test', [
    'jshint',
    'karma:spec'
  ]);

  grunt.registerTask('dev', function() {
    grunt.config.set(['jshint', 'options', 'force'], true);

    grunt.task.run([
      'test',
      'watch'
    ]);
  });
};
