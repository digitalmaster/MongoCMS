'use strict';

var EVE = require('../events');

var NavView =  BB.View.extend({
    el: '.nav',

    events: {
        'click a[data-target="collection"]': 'onCollectionClick',
        'click a[data-target="connect"]': 'onConnectionClick',
        'click a[data-target="config"]': 'onConfigClick'
    },

    onCollectionClick: function(e){
        e.preventDefault();
        EVE.trigger('connect:showCollectionSelect');
    },

    onConnectionClick: function(e){
        e.preventDefault();
        EVE.trigger('connect:show')
    },

    //- TODO: Add Config Panel
    onConfigClick: function(e){
        e.preventDefault();
        console.log('Config clicked');
    }
});

module.exports = new NavView;
