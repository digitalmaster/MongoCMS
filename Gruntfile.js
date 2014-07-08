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
           tasks: ['develop']
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
    },

    nodewebkit: {
        options: {
            build_dir: './builds',
            mac: true,
            win: true,
            linux32: false,
            linux64: false,
            mac_icns: './icons/mcms.icns'
        },
        src: [
            './**/*',
            '!./builds/**/*',
            '!./node_modules/**/*',
            './node_modules/mongodb/**/*',
            './node_modules/mongojs/**/*',
            '!./components/ace-builds/**/*',
            './components/ace-builds/src-noconflict/**/*'
        ]
    }

  });

  grunt.loadNpmTasks('grunt-develop');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-compass');
  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-groundskeeper');
  grunt.loadNpmTasks('grunt-autoprefixer');
  grunt.loadNpmTasks('grunt-node-webkit-builder');

  grunt.registerTask('default', ['compass', 'jade', 'autoprefixer', 'watch']);
  grunt.registerTask('build', ['nodewebkit']);
};
