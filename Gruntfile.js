module.exports = function(grunt) {
  'use strict';

  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    jshint: {
      options: {
        jshintrc: true,
        reporter: require('jshint-stylish')
      },
      src: ['src/**/*.js'],
      spec: ['test/spec/**/*.js']
    },

    karma: {
      specWatch: {
        configFile: "karma.conf.js"
      },
      spec: {
        configFile: "karma.conf.js",
        singleRun: true,
        autoWatch: false
      },
    }
  });

  grunt.registerTask("test", function (target) {
    if (target === 'watch') {
      target = 'specWatch';
    } else {
      target = 'spec';
    }
    grunt.task.run([
      "jshint",
      "karma:" + target
    ]);
  });
};
