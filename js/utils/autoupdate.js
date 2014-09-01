var gui = requireNode('nw.gui');
var copyPath, execPath;
if(gui.App.argv.length){
    copyPath = gui.App.argv[0];
    execPath = gui.App.argv[1];
}

var pkg = require('../../package.json');
var request = requireNode('request');
var path = requireNode('path');
var os = requireNode('os');
var fs = requireNode('fs');
var k = 0;
var d = false;
var updater = requireNode('node-webkit-updater');
var upd = new updater(pkg);
var newVersionCheckIntervalId = null;
var tryingForNewVersion = false;
var versionNumber = $('.version');

if(!copyPath){
    versionNumber.text('current version ' + pkg.version );
    newVersionCheckIntervalId = setInterval(function(){
        if(!d && !tryingForNewVersion) {
            tryingForNewVersion = true; //lock
            upd.checkNewVersion(versionChecked);
          }
      }, 500);
} else {
    console.log("I will copy from", path.resolve(process.cwd(),'../../..'));
    console.log("I will compy to", copyPath);
    versionNumber.text('copying app');

    upd.install(copyPath, newAppInstalled);

    function newAppInstalled(err){
      if(err){
        console.log(err);
        return;
    }
    upd.run(execPath, null);
    gui.App.quit();
}
}

function versionChecked(err, newVersionExists, manifest){
    tryingForNewVersion = false; //unlock
    if(err){
        console.log(err);
        return Error(err);
    }
    else if(d){
        console.log('Already downloading');
        return;
    }
    else if(!newVersionExists){
        console.log('No new version exists');
        return;
    }
    d = true;
    clearInterval(newVersionCheckIntervalId);
    var loaded = 0;
    debugger;
    var newVersion = upd.download(function(error, filename){
        newVersionDownloaded(error, filename, manifest);
    }, manifest);
    newVersion.on('data', function(chunk){
      loaded+=chunk.length;
      versionNumber.text("New version loading " + Math.floor(loaded / 1024) + 'kb');
  })
}

function newVersionDownloaded(err, filename, manifest){
    if(err){
      console.log(err)
      return Error(err);
  }

  versionNumber.text("unpacking: " + filename);
  upd.unpack(filename, newVersionUnpacked, manifest);
}

function newVersionUnpacked(err, newAppPath){
    if(err){
      console.log(err)
      return Error(err);
  }
  console.log(newAppPath, [upd.getAppPath(), upd.getAppExec()]);
  var runner = upd.runInstaller(newAppPath, [upd.getAppPath(), upd.getAppExec()]);
  runner.stdout.on('data',
    function(data){
      console.log(data)
  })
  runner.stderr.on('data', function(data){
      console.log(data)
  })
  gui.App.quit();
}
