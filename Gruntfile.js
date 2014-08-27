'use strict';

var exec = require('child_process').exec;

var isWin = /^win/.test(process.platform);
var isMac = /^darwin/.test(process.platform);
var isLinux = /^linux/.test(process.platform);
var is32 = process.arch == 'ia32';
var is64 = process.arch == 'x64';
var request = require('request');

module.exports = function (grunt) {
    var dest = grunt.option('dest') || './builds';

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
                    pretty: true
                }
            }
        },

        files: {
          'main.html': ['jade/main.jade']
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
                build_dir: dest,
                mac: true,
                win: true,
                linux32: false,
                linux64: false,
                mac_icns: './icons/mcms.icns',
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
        },

        clean:{
            main: ['test/app']
        },

        compress:{
            win:{
                options: {
                    mode: 'zip',
                    archive: dest + '/releases/updapp/win/updapp.zip'
                },
                expand: true,
                cwd: dest + '/releases/updapp/win/updapp',
                src: ['**/**'],
                dest: '/updapp'
            },
            linux32:{
                options: {
                    mode: 'tgz',
                    archive: dest + '/releases/updapp/linux32/updapp.tar.gz'
                },
                expand: true,
                cwd: dest + '/releases/updapp/linux32/updapp',
                src: ['**/**'],
                dest: 'updapp/'
            },
            linux64:{
                options: {
                    mode: 'tgz',
                    archive: dest + '/releases/updapp/linux64/updapp.tar.gz'
                },
                expand: true,
                cwd: dest + '/releases/updapp/linux64/updapp',
                src: ['**/**'],
                dest: 'updapp/'
            }
        },

        copy:{
            win:{
                src: 'tools/*',
                dest: dest + '/releases/updapp/win/updapp/'
            }
        }

});

grunt.loadNpmTasks('grunt-develop');
grunt.loadNpmTasks('grunt-browserify');
grunt.loadNpmTasks('grunt-contrib-watch');
grunt.loadNpmTasks('grunt-contrib-compass');
grunt.loadNpmTasks('grunt-contrib-jade');
grunt.loadNpmTasks('grunt-autoprefixer');
grunt.loadNpmTasks('grunt-node-webkit-builder');
grunt.loadNpmTasks('grunt-contrib-compress');
grunt.loadNpmTasks('grunt-contrib-copy');
grunt.loadNpmTasks('grunt-contrib-clean')

grunt.registerTask('packageMac', function(){
    var done = this.async();
    console.log('packaging...', 'hdiutil create -format UDZO -srcfolder ' + dest + '/releases/updapp/mac/updapp.app ' + dest + '/releases/updapp/mac/updapp.dmg');

    exec('hdiutil create -format UDZO -srcfolder ' + dest + '/releases/updapp/mac/updapp.app ' + dest + '/releases/updapp/mac/updapp.dmg',function(error, stdout, stderr){
      console.log('stdout: ' + stdout);
      console.log('stderr: ' + stderr);
      if (error !== null) {
        console.log('exec error: ' + error);
    }
    done()
    })
})

grunt.registerTask('version', function(){
    var ver = grunt.option('ver');
    customizePackageJson({version: ver}, './app/package.json');

    function customizePackageJson(obj, path){
      var json = require(path);
      for(var i in obj){
        json[i] = obj[i];
    }
    fs.writeFileSync(path, JSON.stringify(json, null, 4));
}
});

grunt.registerTask('version', function(){
    var ver = grunt.option('ver');
    customizePackageJson({version: ver}, './app/package.json');

    function customizePackageJson(obj, path){
      var json = require(path);
      for(var i in obj){
        json[i] = obj[i];
    }
    fs.writeFileSync(path, JSON.stringify(json, null, 4));
}
});

grunt.registerTask('default', ['compass', 'jade', 'autoprefixer', 'watch']);
// grunt.registerTask('build', ['nodewebkit']);

var buildFlow = ['nodewebkit'];
if(isWin) buildFlow.push('copy:win');

grunt.registerTask('buildapp', buildFlow);
};
