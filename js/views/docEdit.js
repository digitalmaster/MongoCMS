define([
    'jquery',
    'underscore',
    'backbone',
    'helpers',
    'events',
], function($, _, BB, Helpers, EVE){

    var EditView = BB.View.extend({
        initialize: function(){
            _.bindAll(this, 'showAddForm');
            this.treeLevels = [];

            EVE.on('edit:showAddForm', this.showAddForm);
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

        template: Helpers.Template('listItemTemplateEdit'),
        templateJSON: Helpers.Template('listItemTemplateEditJSON'),

        setModel: function( model) {
            // unbind all view related things
            this.$el.children().removeData().unbind();
            this.$el.children().remove();
            this.stopListening();

            // clear model
            if ( this.model) {
                this.model.unbind();
                this.model.stopListening();
            }

            // set new model and call initialize
            this.model = model;
            this.delegateEvents( this.events);    // will call undelegateEvents internally
            this.initialize();
        },

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
            var html = Helpers.Template('addAttribute');
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
                if( Helpers.isHTML(value) ) dataObj[i].type = typeMap.html;
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

            Helpers.renderAce(this.model);
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
            Helpers.renderAce();

            $(window).scrollTop(0); // Scroll back to top

            return this;
        },
    });

    return new EditView

});
