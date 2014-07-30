define([
    'jquery',
    'underscore',
    'backbone',
    'helpers',
    'db',
    'events',
], function($, _, BB, Helpers, DB, EVE){

    return BB.View.extend({
        initialize: function(){
            _.bindAll( this , 'monitorStatus', 'setStatus');
            setInterval(this.monitorStatus, 5000);

            EVE.on('status:update', this.setStatus )
        },

        el: '.status-pane',

        events: {
            'click .connection' : 'onConnectionClick'
        },

        monitorStatus: function(){
            if (!DB.client) return;

            var timmer = null;
            var that = this;
            DB.client.runCommand({ping:1}, function(err, res){
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
            EVE.trigger('connect:show');
        }
    });

});
