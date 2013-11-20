'use strict';

(function(exports, $, BB, _){
    App.eve = _.extend({}, BB.Events);

    /*
      ==========================================================================
        Model: Document
      ==========================================================================
    */
    App.Models.Doc = BB.Model.extend({
        initialize: function(){
            console.log('model initialized');
        }
    });

    /*
      ==========================================================================
        View: Document
      ==========================================================================
    */
    App.Views.DocListItem = BB.View.extend({
        tagName: 'li',

        events: {
           'click': 'showEdit'
        },

        className: 'clear',

        template: App.Helpers.Template('listItemTemplate'),

        showEdit: function(e){
            e && e.preventDefault();
            var currentId = $(e.currentTarget).find('a').data('id');
            // get the model
            var model = _.find( App.Collections.docList.models, function(model){
                return currentId == model.get('_id').toString();
            });

            var docEdit = new App.Views.DocEdit({model: model});
            docEdit.render();
        },

        render: function(){
            var data = this.model.toJSON();
            data.id = data._id.toString();
            this.$el.html( this.template(data) );
            return this;
        }
    });

     /*
      ==========================================================================
        View: Document Edit
      ==========================================================================
    */
    App.Views.DocEdit = BB.View.extend({
        el: '.content',

        template: App.Helpers.Template('listItemTemplateEdit'),

        toArray: function(obj){
            return _.map(
                _.pairs(obj),
                function(pair) {
                    return {
                        key: pair[0],
                        value: pair[1]
                    };
                }
            );
        },

        render: function(){
           this.$el.empty();
           var data = this.toArray(this.model.toJSON());
           this.$el.html( this.template({ list : data }) );
           return this;
        },
    });

    /*
     ==========================================================================
       Collection: Documents
     ==========================================================================
    */
    App.Collections.DocList = BB.Collection.extend({
        model: App.Models.Doc,

        db: null,

        fetch: function(success){
            var that = this;

            if(!App.db) throw new Error('No database connection. Cannot fetch data.');

            App.db.collection(App.Config.Auth.collection).find().toArray( function (err, results) {
                if(err){
                    throw err;
                }else{
                    success.call(this, results);
                }
            });
        },

    });

    /*
      ==========================================================================
        View: Docs Collection
      ==========================================================================
    */
    App.Views.DocList = BB.View.extend({
        el: '.documents',

        initialize: function(){
            this.render();
            this.collection.on('reset', this.render, this);
        },

        addOne : function(model){
            if(!model) return;

            var docView = new App.Views.DocListItem({ model: model });
            this.$el.append(docView.render().el);
        },


        render : function(){
            console.log('Collection rendering...');
            this.$el.empty();
            this.collection.each(function(post){
                this.addOne(post);
            }, this);

            this.setSidebarHeight();
            return this;
        },

        setSidebarHeight: function(){
            var total = $(window).height();
            var header = $('header').outerHeight(true);
            var footer = $('footer').outerHeight(true);
            var height = total - header - footer;
            $('ul.documents').height(height);
        },


    })

    /*
      ==========================================================================
        View: Connect modal
      ==========================================================================
    */
    App.Views.Connect = BB.View.extend({
        el: 'form#connect',

        initialize: function(){
            _.bindAll( this , 'notify' );
        },

        events: {
            'submit' : 'onSubmit',
            'change .collection-list': 'onCollectionSelect'
        },

        onSubmit: function(e){
            e.preventDefault();
            var formValues = this.getFormValues();
            this.tryConnect(formValues);
        },

        tryConnect : function(formValues){
            var that = this;
            var mongojs = require('mongojs');
            var config = _.extend(App.Config.Auth, formValues);
            console.log(config);

            // Local url or remote
            var url = '';
            if(config.host == 'localhost' && config.port == "27017"){
                url = config.database;
            }else{
                url = 'mongodb://'+ config.username +':' + config.psw + '@' + config.host +':' + config.port + '/' + config.database;
            }

            this.notify('Connecting..');
            App.db = mongojs(url);
            App.db.getCollectionNames(function(err, names){
                if(err){
                    var msg;
                    switch(err.code){
                        case 18:
                            msg = "Authentication Failed."
                            break;
                        default:
                            msg = "Error: Could not connect"
                    }
                    that.notify(msg);
                }else{
                    that.showSellectCollection(names);
                }

            });

        },

        notify: function(msg){
            this.$el.find('button').text(msg);
        },

        getFormValues: function(){
            var results = this.$el.serializeArray();
            var data = {};
            for (var i = 0; i < results.length; i++) {
                if(results[i].value) data[results[i].name] = results[i].value;
            }
            return data;
        },

        showSellectCollection: function(names){
            var list = this.$el.find('.collection-list').empty().append('<option>Select Collection</option>');
            for (var i = 0; i < names.length; i++) {
                if(names[i].slice(0,6) === 'system') continue;
                $('<option/>').val(names[i]).html(names[i]).appendTo(list);
            }
            list.show();
        },

        onCollectionSelect: function(e){
            App.Config.Auth.collection = $(e.currentTarget).val();
            App.eve.trigger('modal:close');
            App.eve.trigger('status:connected')
        }
    });

    App.init = function(initData){
        App.Views.connect = new App.Views.Connect();
        $( '.js-float-label-wrapper' ).FloatLabel();

        App.eve.on('modal:close', function(){
            $('body').removeClass('md-mode');
        });

        App.eve.on('status:connected', function(){
            console.log('connected');
            // Init Collection
            App.Collections.docList = new App.Collections.DocList();
            App.Collections.docList.on('all', function(e){
                console.log(e);
            })

            // Get Docs
            App.Collections.docList.fetch(function(results){
                // Add data to collection
                App.Collections.docList.reset(results);

                // Init Collection View
                App.Views.docList = new App.Views.DocList({ collection: App.Collections.docList });
            });
        });
    }

})(this, jQuery, Backbone, _);

App.init();
