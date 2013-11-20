'use strict';

var request = require('request');

module.exports = function (grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    watch: {
      options: {
        nospawn: true,
        livereload: true
      },
      js: {
        files: ['js/*.js'],
        tasks: ['concat']
      },
      css: {
        files: ['sass/*.{scss,sass}'],
        tasks: ['compass', 'autoprefixer'],
        options: {
            livereload: true
        }
      },

      jade: {
        files: ['jade/*.jade'],
        tasks: 'jade'
      }
    },

    compass: {
        dist: {
            options: {
                sassDir: 'sass',
                cssDir: 'css',
            }
        }
    },

    jade: {
      compile: {
        options:{
          pretty: true,
          data: { test: 'test'}
        },
        files: {
          'main.html': ['jade/main.jade']
        }
      }
    },

    concat: {
      options: {
      },
      dist: {
        src: [
          'components/jquery/jquery.js',
          'components/underscore/underscore.js',
          'components/backbone/backbone.js',
          'components/nprogress/nprogress.js',
          'components/floatLabel/jquery.FloatLabel.js',
          'js/namespaces.js',
          'js/helpers.js',
          'js/main.js',
        ],
        dest: 'js/<%= pkg.name %>.js',
        nonull: true
      },
    },

    groundskeeper: {
      options: {
        debugger: false,
        console: false
      },
      compile: {
        files: {
          'js/<%= pkg.name %>.js': 'js/<%= pkg.name %>.js'
        }
      }
    },

    autoprefixer: {
      dist: {
        files: {
            'css/main.css': 'css/main.css'
        }
      }
    }

  });

  grunt.loadNpmTasks('grunt-develop');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-compass');
  grunt.loadNpmTasks('grunt-contrib-jade');

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-groundskeeper');
  grunt.loadNpmTasks('grunt-autoprefixer');

  grunt.registerTask('default', ['concat','compass', 'jade', 'autoprefixer', 'watch']);
};
