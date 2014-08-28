'use strict';

var EVE      = require('../events'),
    DB       = require('../db'),
    Settings = require('../settings');

var ConnectView = BB.View.extend({
    el: 'form#connect',

    initialize: function(){
        _.bindAll( this , 'notify', 'showConnectPane', 'showSellectCollection' );

        //Prefill last used login information
        var config = localStorage.getObject('Config');
        if( config && config.Auth ){
            this.fillForm(config.Auth);
        }
        $('.md-overlay-x').on('click', this.close);
        $( '.js-float-label-wrapper' ).FloatLabel();

        // Global Event Bindings
        EVE.on('connect:show', this.showConnectPane)
        EVE.on('connect:showCollectionSelect', this.showSellectCollection)
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
          }}
    },

    tryConnect : function(formValues){
        NProgress.start();
        var that = this;

        var config = Settings.Auth; // defaults
        _.extend(config, formValues );

        // Local url or remote
        var url = 'mongodb://';
        if(config.username && config.psw){
            url += config.username +':' + config.psw + '@'
        }
        url += config.host +':' + config.port + '/' + config.database;

        url += '?auto_reconnect=true&poolSize=20&keepAlive=1'

        this.notify('Connecting..');
        DB.client = DB.module(url);
        DB.client.getCollectionNames(function(err, names){
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
                Settings.Auth.collectionNames = names;
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
        var names = Settings.Auth.collectionNames;
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
        Settings.Auth.collection = $(e.currentTarget).val();
        DB.collection = DB.client.collection(Settings.Auth.collection);
        EVE.trigger('modal:close');
        EVE.trigger('status:connected');
    },

    close: function(){
        EVE.trigger('modal:close')
    }
});


module.exports = new ConnectView;
