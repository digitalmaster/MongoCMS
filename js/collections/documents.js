define([
    'jquery',
    'underscore',
    'backbone',
    'helpers',
    'db',
    'events',
    'models/document',
    'nprogress'
], function($, _, BB, Helpers, DB, EVE, DocumentModel){

    return BB.Collection.extend({
        initialize: function(){
            _.bindAll(this, 'onConnect');
            EVE.on('status:connected', this.onConnect)
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
        }
    });
});
