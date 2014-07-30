define([
    'jquery',
    'underscore',
    'backbone',
    'helpers',
    'db',
    'events',
    'models/document',
    'views/docListItem',
], function($, _, BB, Helpers, DB, EVE, DocumentModel, DocListItem){

    return BB.View.extend({
        el: '.documents',

        initialize: function(){
            _.bindAll(this, 'addNewDoc', 'onConnect');
            this.collection.on('reset', this.render, this);
            $('#sidebar .add-new-doc i').on('click', this.addNewDoc);

            EVE.on('status:connected', this.onConnect)
        },

        onConnect: function(){

        },

        showLoader: function(){
            var html
                = '<p class="text-center">'
                +       '<i class="fa fa-spinner fa-spin"></i>'
                + '</p>';

            this.$el.html(html);
        },

        addNewDoc: function(){
            var id =  DB.client.ObjectId();
            var model = new DocumentModel({_id : id}, { save: true });
            this.collection.add(model);
            this.addOne(model, {edit: true})
        },

        addOne : function(model, options){
            if(!model) return;

            var docView = new DocListItem({ model: model });
            this.$el.append(docView.render().el);

            if(options && options.edit){
                docView.showEdit();
                EVE.trigger('edit:showAddForm');
                // App.Views.docEdit.showAddForm();
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
        }
    });
});
