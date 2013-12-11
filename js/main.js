'use strict';

(function(exports, $, BB, _){
    App.eve = _.extend({}, BB.Events);

    /*
      ==========================================================================
        Model: Document
      ==========================================================================
    */
    App.Models.Doc = BB.DeepModel.extend({
        initialize: function(attr, options){
            this.on('change', this.save);
            this.on('change:title', this.onTitleChange);
            this.on('active:toggle', this.toggleActiveClass);
            this.on('remove', this.destroy);
            if(options.save){
                this.insertNew(this.toJSON());
            }
        },

        insertNew: function(attr){
            App.db.client.save(attr);
        },

        destroy: function(model, options){
            var id = model.get('_id').toString();
            App.db.client.remove(
                { _id: App.mongojs.ObjectId(id) },
                true
            );
        },

        save: function(model){
            var value = JSON.flatten(this.changed);
            var id = model.get('_id').toString();
            var action = this.isRemoving(value) ? '$unset' : '$set';
            var operation = {};
            operation[action] = value;
            App.eve.trigger('status:update', 'Saving..');
            App.db.client.update(
                { _id: App.mongojs.ObjectId(id) },
                operation,
                {
                    multi: false
                },
                function(err){
                    if(err) throw err;

                    App.eve.trigger('status:update', 'Saved', true);
                }
            );
        },

        isRemoving: function(obj){
            for(var key in obj) {
                if(typeof obj[key] === 'undefined') {
                  return true;
                }
              }
            return false;
        },

        onTitleChange: function(model){
            var id = model.get('_id').toString();
            var newTitle = model.get('title');
            App.Views.docList.$el.find('*[data-id="' + id + '"]').find('.title').text(newTitle);
        },

        toggleActiveClass: function(model){
            var id = model.get('_id').toString();
            App.Views.docList.$el.find('*[data-id="' + id + '"]').toggleClass("active");
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
           'click': 'showEdit',
           'click .remove': 'remove'
        },

        className: 'clear',

        template: App.Helpers.Template('listItemTemplate'),

        remove: function(e){
            e.preventDefault();
            e.stopImmediatePropagation();

            var confirmation = confirm('Warning: This will PERMANENTLY delete this record!');
            if(!confirmation) return;

            this.$el.remove();
            App.Collections.docList.remove(this.model);
        },

        showEdit: function(e){
            e && e.preventDefault();

            App.Views.docEdit = new App.Views.DocEdit({model: this.model});
            App.Views.docEdit.render();
            App.Collections.docList.setActive(this.model);
        },

        render: function(){
            var data = this.model.toJSON();
            data.id = this.model.get('_id').toString();

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
        initialize: function(){
            this.treeLevels = [];
        },

        className: 'content',

        events: {
            'focus input.value'    : 'editMode',
            'blur input.value'     : 'onInputBlur',
            'click .navigate'      : 'onNavigateClick',
            'click .breadcrumbs a' : 'onBreadCrumbClick',
            'click .btn-add'       : 'onBtnAddClick',
            'keyup input.newValue' : 'onKeyupNewValue',
            'click .remove'        : 'onRemoveClick'
        },

        treeLevels: [],

        template: App.Helpers.Template('listItemTemplateEdit'),

        editMode: function(e){
            $(e.currentTarget).addClass('editing');
        },

        onRemoveClick: function(e){
            var key = $(e.currentTarget).data('key');

            var confirmation = confirm('Warning: This will PERMANENTLY delete this value!');
            if(!confirmation) return;

            this.model.unset(this.getRelativeKey(key) );
            this.render();
        },

        onKeyupNewValue: function(e){
            if(e.which === 13) {
                this.onBtnAddClick(e);
            }
        },

        onBtnAddClick: function(e){
            var $btn = this.$el.find('.btn-add'),
                save = $btn.hasClass('save');

            if(save){
                var key = this.$el.find('.new input.newKey').val();
                var value = this.$el.find('.new input.newValue').val();
                if( this.recordAttrChange(key, value) ){
                    this.$el.find('.row.new').remove();
                    $btn.removeClass('save');
                    this.render();
                }
            }else{
                this.showAddForm();
            }
        },

        showAddForm: function(){
            var $btn = this.$el.find('.btn-add');

            $btn.addClass('save').html('<i class="fa fa-floppy-o"></i>');
            var html = App.Helpers.Template('addAttribute');
            this.$el.append(html);
            this.$el.find( '.js-float-label-wrapper' ).FloatLabel();
            this.$el.find('.new input.newKey').focus();
            $("html, body").animate({ scrollTop: $(document).height() }, "slow");
        },

        onNavigateClick: function(e){
            e.preventDefault();
            var key = $(e.currentTarget).data('key');
            this.treeLevels.push(key);
            this.render();
        },

        onBreadCrumbClick: function(e){
            var target = $(e.currentTarget).data('target');

            if(target === '$root'){
                this.treeLevels = [];
            }else{
                // delete everything after target in treeLevels
                this.treeLevels.splice( this.treeLevels.indexOf(target) + 1 );
            }

            this.render();
        },

        onInputBlur: function(e){
            $(e.currentTarget).removeClass('editing');
            var attr = $(e.currentTarget).data('key');
            var value = e.currentTarget.value;

            this.recordAttrChange(attr, value);
        },

        recordAttrChange: function(attr, value){
            if( value.toLowerCase() == "true" ){ value = true; }
            else if (value.toLowerCase() == "false"){ value = false }
            else if( $.isNumeric(value) ){ value = +value; }
            else if( Date.parse(value) ){ value = new Date(value); }

            return !!this.model.set( this.getRelativeKey(attr), value );
        },

        getRelativeKey : function(key){
            if(this.treeLevels.length > 0){
                return this.treeLevels.join('.') + '.' + key;
            }else{
                return key;
            }
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

        addDataTypes: function(dataObj){
            var typeMap = {
                string : 0,
                object : 1,
                html   : 2,
                date   : 3
            }

            for (var i = 0; i < dataObj.length; i++) {
                var value = dataObj[i].value;
                if( App.Helpers.isHTML(value) ) dataObj[i].type = typeMap.html;
                else if( value instanceof Date ) dataObj[i].type = typeMap.date;
                else if(typeof value === 'object') dataObj[i].type = typeMap.object;
                else dataObj[i].type = typeMap.string;
            };

            return dataObj;
        },

        render: function(){
            // Cleanup
            $('.content').remove();

            var data = this.model.toJSON();
            data._id.idString = this.model.get('_id').toString();
            if(this.treeLevels.length > 0){
                var traversed = Object.getByString(data, this.treeLevels.toString());
                data = this.toArray(traversed);
            }else{
                data = this.toArray(data);
            }

            data = this.addDataTypes(data);

            //Append to DOM
            this.$el.html( this.template({
                list : data,
                tree : this.treeLevels
            }));
            $('.content-wrapper').append(this.el);
            this.delegateEvents(); // Because $.remove() also removes delegated Events

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

        active: null,

        fetch: function(success){
            var that = this;
            App.eve.trigger('status:update', 'Getting Docs..');

            if(!App.db) throw new Error('No database connection. Cannot fetch data.');

            App.db.client.find().sort({ created: -1 }).toArray( function (err, results) {
                if(err){
                    throw err;
                }else{
                    success.call(this, results);
                    App.eve.trigger('status:update','Docs Received', true);
                }
            });
        },

        setActive: function(model){
            if(this.active){
                this.active.trigger('active:toggle', this.active);
            }

            this.active = model;
            this.active.trigger('active:toggle', this.active );
        }

    });

    /*
      ==========================================================================
        View: Docs Collection
      ==========================================================================
    */
    App.Views.DocList = BB.View.extend({
        el: '.documents',

        initialize: function(){
            _.bindAll(this, 'addNewDoc');
            this.collection.on('reset', this.render, this);
            $('#sidebar .add-new-doc i').on('click', this.addNewDoc);
        },

        showLoader: function(){
            var html
                = '<p class="text-center">'
                +       '<i class="fa fa-spinner fa-spin"></i>'
                + '</p>';

            this.$el.html(html);
        },

        addNewDoc: function(){
            var id =  App.mongojs.ObjectId();
            var model = new App.Models.Doc({_id : id}, { save: true });
            this.collection.add(model);
            this.addOne(model, {edit: true})
        },

        addOne : function(model, options){
            if(!model) return;

            var docView = new App.Views.DocListItem({ model: model });
            this.$el.append(docView.render().el);

            if(options && options.edit){
                docView.showEdit();
                App.Views.docEdit.showAddForm();
                this.$el.animate({ scrollTop: this.$el[0].scrollHeight }, "slow");
            }
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
            $('.md-overlay-x').on('click', this.close);
            $( '.js-float-label-wrapper' ).FloatLabel();
        },

        events: {
            'submit' : 'onSubmit',
            'change .collection-list': 'onCollectionSelect',
            'click .show-connect': 'showConnectPane'
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
              }
            }
        },

        tryConnect : function(formValues){
            var that = this;
            App.mongojs = require('mongojs');

            var config = App.Config.Auth; // defaults
            _.extend(config, formValues );

            // Local url or remote
            var url = 'mongodb://';
            if(config.username && config.psw){
                url += config.username +':' + config.psw + '@'
            }
            url += config.host +':' + config.port + '/' + config.database;

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
                    that.notify('Connect');
                    App.Config.Auth.collectionNames = names;
                    that.showSellectCollection();
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

        showSellectCollection: function(){
            var names = App.Config.Auth.collectionNames;
            // Hide Connection pane
            this.$el.find('.connect-pane').addClass('hide');
            this.$el.find('.select-collection-pane').removeClass('hide');

            var list = this.$el.find('.collection-list').empty().append('<option>Select Collection</option>');
            for (var i = 0; i < names.length; i++) {
                if(names[i].slice(0,6) === 'system') continue;
                $('<option/>').val(names[i]).html(names[i]).appendTo(list);
            }
            list.show().focus();
        },

        showConnectPane: function(){
            this.$el.find('.connect-pane').removeClass('hide');
            this.$el.find('.select-collection-pane').addClass('hide');
        },

        onCollectionSelect: function(e){
            App.Config.Auth.collection = $(e.currentTarget).val();
            App.db.client = App.db.collection(App.Config.Auth.collection);
            App.eve.trigger('modal:close');
            App.eve.trigger('status:connected');
        },

        close: function(){
            App.eve.trigger('modal:close')
        }
    });

    /*
      ==========================================================================
        View Reference: Status Pane
      ==========================================================================
    */
    App.Views.StatusPane = BB.View.extend({
        el: '.status-pane',

        events: {
            'click .connection' : 'onConnectionClick'
        },

        setStatus: function(msg, reset){
            var that = this;
            this.$el.find('.status').text(msg);

            if(reset){
                setTimeout(function(){
                    that.$el.find('.status').text('Idle');
                }, 2000);
            }
        },

        onConnectionClick: function(){
            App.eve.trigger('connect:show');
        }
    });

    App.Views.Navigation = BB.View.extend({
        el: '.nav',

        events: {
            'click a[data-target="collection"]': 'onCollectionClick',
            'click a[data-target="connect"]': 'onConnectionClick',
            'click a[data-target="config"]': 'onConfigClick'
        },

        onCollectionClick: function(e){
            App.eve.trigger('connect:showCollectionSelect');
        },

        onConnectionClick: function(e){
            App.eve.trigger('connect:show')
        },

        onConfigClick: function(e){
            console.log('Config clicked');
        }
    });


    App.init = function(initData){
        App.Views.connect = new App.Views.Connect();
        App.Views.navigation = new App.Views.Navigation();
        App.Views.statusPane = new App.Views.StatusPane();

        // Init Collection
        App.Collections.docList = new App.Collections.DocList();

        // Init Collection View
        App.Views.docList = new App.Views.DocList({ collection: App.Collections.docList });

        App.eve.on('status:connected', function(){
            App.Views.docList.showLoader();
            // Get Docs
            App.Collections.docList.fetch(function(results){
                // Add data to collection
                App.Collections.docList.reset(results);
                App.eve.trigger('showStartPage');
            });

        });

        // Eve
        App.eve.on('modal:close', function(){
            $('body').removeClass('md-mode');
            $('.md-overlay-x').removeClass('hide');
        });

        App.eve.on('modal:show', function(){
            $('body').addClass('md-mode');
        });

        App.eve.on('status:update', function(msg, reset){
            App.Views.statusPane.setStatus(msg, reset);
        });

        App.eve.on('connect:show', function(){
            App.eve.trigger('modal:show');
            App.Views.connect.showConnectPane();
        });

        App.eve.on('connect:showCollectionSelect', function(){
            App.eve.trigger('modal:show');
            App.Views.connect.showSellectCollection();
        });

        App.eve.on('showStartPage', function(){
            $('.content').html( App.Helpers.Template('startPageTemplate')() );
        });
    }

})(this, jQuery, Backbone, _);

App.init();
$('body').css('min-height', $(window).height()); // I know.. i'm ashamed
