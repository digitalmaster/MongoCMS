'use strict';

var DB  = require('../db'),
    EVE = require('../events');

module.exports = BB.DeepModel.extend({
    initialize: function(attr, options){
        this.on('change', this.save);
        this.on('change:title', this.onTitleChange);
        this.on('remove', this.destroy);
        if(options.save){
            this.insertNew(this.toJSON());
        }
    },

    insertNew: function(attr){
        DB.collection.save(attr);
    },

    //-- TODO: Implement Undo last
    destroy: function(model, options){
        var id = model.get('_id').toString();
        NProgress.start();
        DB.collection.remove(
            { _id: DB.client.ObjectId(id) },
            true,
            function(err){
                if(err) console.error('Could not deleting document', err);
                NProgress.done();
            }
        );
    },

    save: function(model){
        NProgress.start();
        var data = $.parseJSON( JSON.stringify( this.toJSON() ) );
        delete data['_id']
        data = this.modelProcessor(data)
        data['_id'] = this.get('_id');

        console.log(data);
        DB.collection.save(data, function(err, doc){
            if(err) console.log(err);

            EVE.trigger('status:update', 'Saved', true);
            NProgress.done();
        });
    },

    modelProcessor: function(obj) {
        function loopThrough(obj)
        {
            for (var k in obj)
            {
                if (typeof obj[k] == "object" && obj[k] !== null)
                    loopThrough(obj[k]);
                else
                    if (typeof obj[k] == "string" && Date.parse(obj[k])){
                        obj[k] = new Date( Date.parse(obj[k]) );
                    }
            }
        }
        loopThrough(obj);
        return obj
    },

    onTitleChange: function(model){
        var id = model.get('_id').toString();
        var newTitle = model.get('title');

        // Todo: Re-Implement or lets play with reactjs!
        // App.Views.docList.$el.find('*[data-id="' + id + '"]').find('.title').text(newTitle);
    },
});
