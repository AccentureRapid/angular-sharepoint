module.exports = function(grunt) {
  'use strict';

  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    watch: {
      test: {
        files: ['src/**/*.js', 'test/spec/**/*.js'],
        tasks: ['test']
      },
      docs: {
        files: ['src/**/*.js'],
        tasks: ['ngdocs']
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
    },

    ngdocs: {
      api: {
        src: [
          'src/sharepoint.js',
          'src/**/*.js'
        ],
        title: 'API Reference'
      }
    },

    connect: {
      docs: {
        options: {
          port: 9002,
          base: 'docs',
          open: true,
          keepalive: true
        }
      }
    },

    ngmin: {
      dist: {
        expand: true,
        cwd: 'src',
        src: ['**/*.js'],
        dest: '.tmp'
      }
    },

    clean: {
      dist: [
        'dist/*.{js,map}'
      ],
      tmp: ['.tmp']
    },

    concat: {
      dist: {
        src: [
          '.tmp/sharepoint.js',
          '.tmp/services/*.js'
        ],
        dest: 'dist/angular-sharepoint.js'
      }
    },

    uglify: {
      dist: {
        options: {
          sourceMap: true
        },
        files: {
          'dist/angular-sharepoint.min.js': ['dist/angular-sharepoint.js']
        }
      }
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

  grunt.registerTask('docs', ['ngdocs', 'connect:docs']);

  grunt.registerTask('build', [
    'clean:tmp',
    'clean:dist',
    'ngmin:dist',
    'concat:dist',
    'uglify:dist'
  ]);
};
