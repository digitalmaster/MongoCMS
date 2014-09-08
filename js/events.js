'use strict';

var EVE =  _.extend({}, BB.Events);

EVE.on('modal:close', function(){
    $('body').removeClass('md-mode');
    $('.md-overlay-x').removeClass('hide');
});

EVE.on('modal:show', function(){
    $('body').addClass('md-mode');
});

// EVE.on('status:update', function(msg, reset){
//     App.Views.statusPane.setStatus(msg, reset);
// });

EVE.on('connect:show', function(){
    EVE.trigger('modal:show');
});

EVE.on('connect:showCollectionSelect', function(){
    EVE.trigger('modal:show');
});

// EVE.on('showStartPage', function(){
//     // Render first doc on start for now
//     if( App.Collections.docList.length ){
//         App.Views.docList.$el.find('li').first().click()
//     }
//     //- TODO: Show a legit start page
//     // $('.content').html( App.Helpers.Template('startPageTemplate')() );
// });
module.exports = EVE;
