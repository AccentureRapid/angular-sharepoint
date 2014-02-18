module.exports = function(grunt) {
  'use strict';

  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    jshint: {
      options: {
        jshintrc: true
      },
      src: ['src/**/*.js'],
      spec: ['test/spec/**/*.js']
    }
  });
};
