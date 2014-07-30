define([
    'jquery',
    'underscore',
    'backbone',
    'helpers',
    'views/connect',
    'views/navigation',
    'views/docList',
    'views/statusPane',
    'collections/documents'
], function($, _, BB, Helpers, ConnectView, NavigationView, DocListView, StatusView, DocCollection){
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

    return {
        init: init
    }
});
