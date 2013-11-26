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
            this.on('change', this.save);
            this.on('change:title', this.onTitleChange);
        },

        save: function(model){
            var id = model.get('_id').toString();
            App.eve.trigger('status:update', 'Saving..');
            App.db.client.update(
                { _id: App.mongojs.ObjectId(id) },
                { $set: this.changed },
                {},
                function(err){
                    if(err) throw err;

                    App.eve.trigger('status:update', 'Saved', true);
                }
            );
        },

        onTitleChange: function(model){
            var id = model.get('_id').toString();
            var newTitle = model.get('title');
            App.Views.docList.$el.find('*[data-id="' + id + '"]').find('.title').text(newTitle);
        }
    });

    /*
      ==========================================================================
        View: Sidebar List Item
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

            App.Views.docEdit = new App.Views.DocEdit({model: model});
            App.Views.docEdit.render();
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
        className: 'content',

        events: {
            'focus input.value': 'editMode',
            'blur input.value': 'onInputBlur'
        },

        template: App.Helpers.Template('listItemTemplateEdit'),

        editMode: function(e){
            $(e.currentTarget).addClass('editing');
        },

        onInputBlur: function(e){
            $(e.currentTarget).removeClass('editing');
            var attr = $(e.currentTarget).data('key');
            var value = e.currentTarget.value;

            this.recordAttrChange(attr, value);
        },

        recordAttrChange: function(attr, value){
            this.model.set(attr, value);
        },

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

        addDataType: function(dataObj){
            var typeMap = {
                string : 0,
                html   : 1,
                date   : 2
            }

            for (var i = 0; i < dataObj.length; i++) {
                var str = dataObj[i].value;
                if( App.Helpers.isHTML(str) ) dataObj[i].type = typeMap.html;
                else dataObj[i].type = typeMap.string
            };

            return dataObj;
        },

        render: function(){
            // Cleanup
            $('.content').remove();

            var data = this.toArray(this.model.toJSON());
            data = this.addDataType(data);

            //Append to DOM
            this.$el.html( this.template({ list : data }) );
            $('.content-wrapper').append(this.el);

            //Render Ace
            ace.config.set("basePath", "components/ace-builds/src-noconflict/");
            App.Helpers.renderAce();

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
            App.eve.trigger('status:update', 'Getting Docs..');

            if(!App.db) throw new Error('No database connection. Cannot fetch data.');

            App.db.client.find().toArray( function (err, results) {
                if(err){
                    throw err;
                }else{
                    success.call(this, results);
                    App.eve.trigger('status:update','Docs Received', true);
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

            //Prefill last used login information
            var config = localStorage.getObject('Config');
            if( config && config.Auth ){
                this.fillForm(config.Auth);
            }

            $( '.js-float-label-wrapper' ).FloatLabel();
        },

        events: {
            'submit' : 'onSubmit',
            'change .collection-list': 'onCollectionSelect'
        },

        onSubmit: function(e){
            e.preventDefault();
            var formValues = this.getFormValues();

            //Store form values
            var config = localStorage.getObject('Config');
            if(!config) config = {};
            config.Auth = formValues;
            localStorage.setObject('Config', config);
            this.tryConnect(formValues);
        },

        fillForm: function(auth){
            for (var key in auth) {
              if (auth.hasOwnProperty(key)) {
                this.$el.find('input[name="' + key + '"]').attr('value', auth[key]);
                console.log(key + " -> " + auth[key]);
              }
            }
        },

        tryConnect : function(formValues){
            var that = this;
            App.mongojs = require('mongojs');
            var config = _.extend(App.Config.Auth, formValues);

            // Local url or remote
            var url = '';
            if(config.host == 'localhost' && config.port == "27017"){
                url = config.database;
            }else{
                url = 'mongodb://'+ config.username +':' + config.psw + '@' + config.host +':' + config.port + '/' + config.database;
            }

            this.notify('Connecting..');
            App.db = App.mongojs(url);
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
            App.db.client = App.db.collection(App.Config.Auth.collection);
            App.eve.trigger('modal:close');
            App.eve.trigger('status:connected')
        }
    });

    /*
      ==========================================================================
        View Reference: Status Pane
      ==========================================================================
    */
    App.Views.StatusPane = BB.View.extend({
        el: '.status-pane',

        setStatus: function(msg, reset){
            var that = this;
            this.$el.find('.status').text(msg);

            if(reset){
                setTimeout(function(){
                    that.resetStatus();
                }, 2000);
            }
        },

        resetStatus: function(){
            this.$el.find('.status').text('Idle');
        }
    });


    App.init = function(initData){
        App.Views.connect = new App.Views.Connect();

        App.Views.statusPane = new App.Views.StatusPane();

        App.eve.on('status:connected', function(){
            // Init Collection
            App.Collections.docList = new App.Collections.DocList();

            // Get Docs
            App.Collections.docList.fetch(function(results){
                // Add data to collection
                App.Collections.docList.reset(results);

                // Init Collection View
                App.Views.docList = new App.Views.DocList({ collection: App.Collections.docList });
            });

        });

        // Eve
        App.eve.on('modal:close', function(){
            $('body').removeClass('md-mode');
        });

        App.eve.on('status:update', function(msg, reset){
            App.Views.statusPane.setStatus(msg, reset);
        });
    }

})(this, jQuery, Backbone, _);

App.init();
