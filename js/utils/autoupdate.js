'use strict';

var gui = requireNode('nw.gui');
var pkg = require('../../package.json');
var updater = requireNode('node-webkit-updater');
var upd = new updater(pkg);
var copyPath, execPath, newManifest;
var notification = $('.notification-bar');

var showUpdateNotification = function(){
    notification.slideDown('fast');
    notification.on('click', '.close-btn', hideUpdateNotification);
    notification.on('click', function(e){
        e.preventDefault();
        upgradeNow(newManifest);
        notification.find('.message').html('<b>Updating...</b>');
    });
}

var hideUpdateNotification = function(e){
    e.preventDefault();
    e.stopImmediatePropagation();
    notification.slideUp('fast');
}

/* Downloads the new version, unpacks it, replaces the existing files, runs the new version, and exits the old app */
var upgradeNow = function(newManifest) {
    var newVersion = upd.download(function(error, filename) {
        if (!error) {
            notification.find('.message').html('<b>Unpacking...</b>');
            upd.unpack(filename, function(error, newAppPath) {
                if (!error) {
                    upd.runInstaller(newAppPath, [upd.getAppPath(), upd.getAppExec()],{});
                    gui.App.quit();
                }
            }, newManifest);
        }
    }, newManifest);

    var loaded = 0;
    newVersion.on('data', function(chunk){
        console.log(chunk.length);
        loaded+=chunk.length;
        notification.find('.message').html('<b>Downloading:</b> ' + Math.floor(loaded / newVersion['content-length'] * 100) + '% Complete');
    });
}

/* Args passed when new app is launched from temp dir */
if(gui.App.argv.length){
    copyPath = gui.App.argv[0];
    execPath = gui.App.argv[1];
}

if(copyPath){
    /* Replace old app with this one. Run updated app and close this instance */
    upd.install(copyPath, newAppInstalled);
    var newAppInstalled = function(err){
        if(!err){
            upd.run(execPath, null);
            gui.App.quit();
        }
    }
}else {
    /* Checks the remote manifest for latest available version and calls the autoupgrading function */
    upd.checkNewVersion(function(error, newVersionExists, manifest) {
        if (!error && newVersionExists) {
            showUpdateNotification();
        }
    });
}



