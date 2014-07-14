
(function(exports, $, BB, _){
    'use strict';

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
            this.on('remove', this.destroy);
            if(options.save){
                this.insertNew(this.toJSON());
            }
        },

        insertNew: function(attr){
            App.db.client.save(attr);
        },

        //-- TODO: Implement Undo last
        destroy: function(model, options){
            var id = model.get('_id').toString();
            NProgress.start();
            App.db.client.remove(
                { _id: App.mongojs.ObjectId(id) },
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

            App.db.client.save(data, function(err, doc){
                if(err) console.log(err);

                App.eve.trigger('status:update', 'Saved', true);
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
            App.Views.docList.$el.find('*[data-id="' + id + '"]').find('.title').text(newTitle);
        },
    });

    /*
      ==========================================================================
        View: Sidebar List Item
      ==========================================================================
    */
    App.Views.DocListItem = BB.View.extend({
        tagName: 'li',

        events: {
           'click': 'onItemClick',
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

        onItemClick: function(e){
            e && e.preventDefault();
            App.Views.docList.$el.find('a.active').removeClass('active');
            this.$el.find('a').addClass("active");
            this.showEdit();
        },

        showEdit: function(){
            App.Views.docEdit = new App.Views.DocEdit({model: this.model});
            App.Views.docEdit.render();
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
            'click .remove'        : 'onRemoveClick',
            'click .edit-raw'      : 'onEditJsonClick'
        },

        treeLevels: [],

        template: App.Helpers.Template('listItemTemplateEdit'),
        templateJSON: App.Helpers.Template('listItemTemplateEditJSON'),

        onEditJsonClick: function(e){
            e.preventDefault();
            $(e.currentTarget).hide();
            this.$el.find('.btn-add').hide();
            this.$el.find('.breadcrumbs').css('visibility', 'hidden');
            this.renderJSON();
        },

        onRemoveClick: function(e){
            e.preventDefault();
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
            e.preventDefault();
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
            e.preventDefault();
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

        editMode: function(e){
            $(e.currentTarget).addClass('editing');
        },

        renderJSON: function(){
            this.$el.find('.editableRow').remove();

            //Append to DOM
            this.$el.find('.id').after(this.templateJSON())

            App.Helpers.renderAce(this.model);
        },

        render: function(){
            var data = {};

            // Cleanup
            $('.content').remove();

            data = this.model.toJSON();
            delete data['_id'];

            // Navigate
            if(this.treeLevels.length > 0){
                data = Object.getByString(data, this.treeLevels.toString());
            }

            data = this.toArray(data);

            // Add ID String row
            data.unshift({
                key : '_id',
                value : this.model.get('_id').toString()
            });

            // Add datat types (Number, bool, html etc)
            data = this.addDataTypes(data);

            //Append to DOM
            this.$el.html( this.template({
                list : data,
                tree : this.treeLevels
            }));
            $('.content-wrapper').append(this.el);
            this.delegateEvents(); // Because $.remove() also removes delegated Events

            //Render Ace
            App.Helpers.renderAce();

            $(window).scrollTop(0); // Scroll back to top

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

            if(!App.db) console.error('No database connection. Cannot fetch data.');

            App.db.client.find().sort({ created: -1 }).toArray( function (err, results) {
                if(err){
                    console.error('Could not fetch collection', err);
                }else{
                    success.call(this, results);
                    App.eve.trigger('status:update','Docs Received', true);
                }
            });
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
            NProgress.start();
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

            url += '?auto_reconnect=true&poolSize=20&keepAlive=1'

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
                    console.error(msg, err);
                    that.notify(msg);
                }else{
                    that.notify('Connect');
                    App.Config.Auth.collectionNames = names;
                    that.showSellectCollection();
                }
                NProgress.done();
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
        initialize: function(){
            _.bindAll( this , 'monitorStatus' );
            setInterval(this.monitorStatus, 5000);
        },

        el: '.status-pane',

        events: {
            'click .connection' : 'onConnectionClick'
        },

        monitorStatus: function(){
            var timmer = null;
            var that = this;
            App.db.runCommand({ping:1}, function(err, res){
                clearTimeout(timmer);
                timmer = null;
                if(!err && res.ok){
                    that.updateConnectionStatus(true);
                }else{
                    that.updateConnectionStatus(false);
                }
            });
            if(!timmer){
                timmer = setTimeout(function(){
                    that.updateConnectionStatus(false);
                }, 3500);
            }
        },

        updateConnectionStatus: function(isConnected){
            if(!_.isBoolean(isConnected)) console.error('Expected boolean value');

            var statText = this.$el.find('.connection');
            if(isConnected) statText.removeClass('offline').text('Connected');
            else statText.addClass('offline').text('Offline');
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

    /*
      ==========================================================================
        View Reference: Main Navigation
      ==========================================================================
    */
    App.Views.Navigation = BB.View.extend({
        el: '.nav',

        events: {
            'click a[data-target="collection"]': 'onCollectionClick',
            'click a[data-target="connect"]': 'onConnectionClick',
            'click a[data-target="config"]': 'onConfigClick'
        },

        onCollectionClick: function(e){
            e.preventDefault();
            App.eve.trigger('connect:showCollectionSelect');
        },

        onConnectionClick: function(e){
            e.preventDefault();
            App.eve.trigger('connect:show')
        },

        //- TODO: Add Config Panel
        onConfigClick: function(e){
            e.preventDefault();
            console.log('Config clicked');
        }
    });

    App.init = function(initData){
        App.Views.connect = new App.Views.Connect();
        App.Views.navigation = new App.Views.Navigation();

        // Init Collection
        App.Collections.docList = new App.Collections.DocList();

        // Init Collection View
        App.Views.docList = new App.Views.DocList({ collection: App.Collections.docList });

        App.eve.on('status:connected', function(){
            App.Views.statusPane = new App.Views.StatusPane();
            App.Views.docList.showLoader();
            NProgress.start();
            // Get Docs
            App.Collections.docList.fetch(function(results){
                NProgress.done();
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
            // Render first doc on start for now
            if( App.Collections.docList.length ){
                App.Views.docList.$el.find('li').first().click()
            }
            //- TODO: Show a legit start page
            // $('.content').html( App.Helpers.Template('startPageTemplate')() );
        });
    }

})(this, jQuery, Backbone, _);

process.on('uncaughtException', function(err) {
    console.log("Uncaught exception!", err);
});

App.Helpers.initNativeKeyboardShortcuts();
App.Helpers.initRighClickMenu();
App.init();
window.title = 'test'
$('body').css('min-height', $(window).height()); // I know.. i'm ashamed
