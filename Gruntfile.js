'use strict';

var exec = require('child_process').exec;
var fs = require('fs');
var request = require('request');
var path = require('path');

var isWin   = /^win/.test(process.platform);
var isMac   = /^darwin/.test(process.platform);
var isLinux = /^linux/.test(process.platform);
var is32    = process.arch == 'ia32';
var is64    = process.arch == 'x64';
var pkg     = null;

module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-develop');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-compass');
    grunt.loadNpmTasks('grunt-contrib-jade');
    grunt.loadNpmTasks('grunt-autoprefixer');
    grunt.loadNpmTasks('grunt-node-webkit-builder');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-copy');

    pkg = grunt.file.readJSON('package.json')
    var dest = grunt.option('dest') || './builds';
    var version_dir = '/MongoCMS\\ -\\ v' + pkg.version;

    var alter_pkg = function(obj){
        var path = './package.json'
        var pkg = require(path);
        for(var i in obj){
            pkg[i] = obj[i];
        }
        fs.writeFileSync(path, JSON.stringify(pkg, null, 4));
    }

    grunt.initConfig({
        watch: {
            options: {
                nospawn: true,
                livereload: true
            },

            js: {
                files: ['js/**/*.js'],
                tasks: ['browserify:dev']
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

        browserify: {
            dev: {
                files: { 'js/bundle.js': ['js/main.js'] },
                options: { bundleOptions: { debug: true } }
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
                    pretty: true
                },

                files: {
                  'main.html': ['jade/main.jade']
                },
            },
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
                version: '0.8.6',
                build_dir: dest,
                mac: true,
                win: true,
                linux32: false,
                linux64: false,
                macIcns: './icons/mcms.icns',
                winIco: './icons/mcms.ico',
                buildType: 'versioned',
            },
            src: [
                './**/*',
                '!./builds/**/*',
                '!./cache/**/*',
                '!./node_modules/**/*',
                './node_modules/mongodb/**/*',
                './node_modules/mongojs/**/*',
                './node_modules/node-webkit-updater/**/*',
                '!./components/ace-builds/**/*',
                './components/ace-builds/src-noconflict/**/*'
            ]
        }
    });

    grunt.registerTask('packageMac', function(){
        var done = this.async();
        var cmd = 'hdiutil create -ov -format UDZO -srcfolder ' + dest + version_dir + '/osx/MongoCMS.app ' + dest + version_dir + '/osx/MongoCMS.dmg';
        console.log(cmd);

        exec(cmd, function(error, stdout, stderr){
            if(stdout) console.log('stdout: ' + stdout);
            if(stderr) console.log('stderr: ' + stderr);
            if (error !== null) {
                console.log('exec error: ' + error);
            }
            done();
        });
    });

    grunt.registerTask('packageWin', function(){
        var done = this.async();
        var cmd = 'zip -r -X -j ' + dest + version_dir + '/win/MongoCMS.zip ' + path.resolve(dest + version_dir + '/win');
        console.log(cmd);

        exec(cmd, function(error, stdout, stderr){
            if(stdout) console.log('stdout: ' + stdout);
            if(stderr) console.log('stderr: ' + stderr);
            if (error !== null) {
                console.log('exec error: ' + error);
            }
            done();
        });
    });

    grunt.registerTask('version', function(){
        var ver = grunt.option('ver');
        customizePackageJson({version: ver}, './app/package.json');

        function customizePackageJson(obj, path){
            var json = require(path);
            for(var i in obj){
                json[i] = obj[i];
            }
        }
        fs.writeFileSync(path, JSON.stringify(json, null, 4));
    });

    grunt.registerTask('test', function(){
        alter_pkg({jose: 'rocks'});
    });

    grunt.registerTask('default', ['compass', 'jade', 'autoprefixer', 'browserify:dev', 'watch']);

    var buildFlow = ['nodewebkit', 'packageMac', 'packageWin'];
    if(isWin) buildFlow.push('copy:win');

    grunt.registerTask('build', buildFlow);

}

