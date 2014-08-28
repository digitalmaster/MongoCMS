'use strict';

var ConnectView    = require('./views/connect'),
    NavigationView = require('./views/navigation'),
    DocListView    = require('./views/docList'),
    StatusView     = require('./views/statusPane'),
    DocCollection  = require('./collections/documents');

var init = function(){
    // Init Collection
    var docList = new DocCollection();

    // Init Collection View
    var docListView = new DocListView({ collection: docList });

    Helpers.initNativeKeyboardShortcuts();
    Helpers.initRighClickMenu();
    // App.init();
    $('body').css('min-height', $(window).height()); // I know.. i'm ashamed
};

module.exports = {
    init: init
}

