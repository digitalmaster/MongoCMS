'use strict';

var gui = requireNode('nw.gui');
var pkg = require('../../package.json');
var updater = requireNode('node-webkit-updater');
var upd = new updater(pkg);
var copyPath, execPath, newManifest;

var showUpdateNotification = function(){
    var notification = $('.notification-bar');

    notification.slideDown('fast');
    notification.on('click', '.close-btn', hideUpdateNotification);
    notification.on('click', function(e){
        e.preventDefault();
        upgradeNow(newManifest);
        notification.find('.message').text('Updating.....');
    });
}

var hideUpdateNotification = function(e){
    e.preventDefault();
    e.stopImmediatePropagation();
    $('.notification-bar').slideUp('fast');
}

/* Downloads the new version, unpacks it, replaces the existing files, runs the new version, and exits the old app */
var upgradeNow = function(newManifest) {
    upd.download(function(error, filename) {
        if (!error) {
            upd.unpack(filename, function(error, newAppPath) {
                if (!error) {
                    upd.runInstaller(newAppPath, [upd.getAppPath(), upd.getAppExec()],{});
                    gui.App.quit();
                }
            }, newManifest);
        }
    }, newManifest);
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



