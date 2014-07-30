define([
    'jquery',
    'underscore',
    'backbone',
    'helpers',
    'views/docEdit'
], function($, _, BB, Helpers, DocEditView){
    return BB.View.extend({
        tagName: 'li',

        events: {
           'click': 'onItemClick',
           'click .remove': 'remove'
        },

        className: 'clear',

        template: Helpers.Template('listItemTemplate'),

        remove: function(e){
            e.preventDefault();
            e.stopImmediatePropagation();

            var confirmation = confirm('Warning: This will PERMANENTLY delete this record!');
            if(!confirmation) return;

            alert('find way to reach collection');
            // this.$el.remove();
            // App.Collections.docList.remove(this.model);
        },

        onItemClick: function(e){
            e && e.preventDefault();
            this.$el.parent().find('a.active').removeClass('active');
            this.$el.find('a').addClass("active");
            this.showEdit();
        },

        showEdit: function(){
            DocEditView.setModel(this.model);
            DocEditView.render();
        },

        render: function(){
            var data = this.model.toJSON();
            data.id = this.model.get('_id').toString();

            this.$el.html( this.template(data) );
            return this;
        }
    });
});
