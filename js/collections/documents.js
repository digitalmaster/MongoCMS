'use strict';

var DB      = require('../db'),
    EVE     = require('../events'),
    DocumentModel = require('../models/document');

module.exports = BB.Collection.extend({
    initialize: function(){
        _.bindAll(this, 'onConnect', 'onRemove');

        EVE.on('status:connected', this.onConnect);
        EVE.on('collection:remove', this.onRemove);
    },

    model: DocumentModel,

    db: null,

    active: null,

    onConnect: function(){
        var that = this;
        this.fetch(function(results){
            NProgress.done();
            // Add data to collection
            that.reset(results);
            EVE.trigger('showStartPage');

        });
    },

    fetch: function(success){
        var that = this;
        EVE.trigger('status:update', 'Getting Docs..');
        NProgress.start();

        if(!DB) console.error('No database connection. Cannot fetch data.');

        DB.collection.find().sort({ created: -1 }).toArray( function (err, results) {
            if(err){
                console.error('Could not fetch collection', err);
            }else{
                success.call(this, results);
                EVE.trigger('status:update','Docs Received', true);
            }
        });
    },

    onRemove: function(model){
        this.remove(model);
    }
});
