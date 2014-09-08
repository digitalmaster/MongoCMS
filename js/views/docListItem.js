var EVE         = require('../events'),
    DocEditView = require('./docEdit')

module.exports = BB.View.extend({
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

        this.$el.remove();
        EVE.trigger('collection:remove', this.model);
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
