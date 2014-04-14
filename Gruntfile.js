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

        sass: {
            options: {
              livereload: false
            },
            files: ['sass/*.{scss,sass}'],
            tasks: ['compass'],
        },

        css: {
            options: {
                livereload: true,
                nospawn: true,
                interrupt: true
            },
            tasks: ['compass', 'autoprefixer'],
            files: ['css/main.css']
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

  grunt.loadNpmTasks('grunt-groundskeeper');
  grunt.loadNpmTasks('grunt-autoprefixer');

  grunt.registerTask('default', ['compass', 'jade', 'autoprefixer', 'watch']);
};
