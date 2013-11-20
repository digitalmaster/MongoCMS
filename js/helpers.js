App.Helpers = {
    Template: function(template){
      return _.template( $('#' + template).html() );
    },

    removeClassesStartingWith: function(selector, prefix){
      $el = $(selector);
      var classes = $el.attr("class").split(" ").filter(function(item) {
          return item.indexOf(prefix) === -1 ? item : "";
      });
      $el.attr("class", classes.join(" "));
    },

    forceRedraw: function(obj) {
      obj.hide();
      obj.each(function() {
          this.offsetHeight;
      });
      obj.show();
    },

    initDisqusCount: function(){
      if( typeof(DISQUSWIDGETS) !== 'undefined' ){
        DISQUSWIDGETS.getCount();
      }else{
        (function () {
          var s = document.createElement('script'); s.async = true;
          s.type = 'text/javascript';
          s.src = 'http://' + disqus_shortname + '.disqus.com/count.js';
          (document.getElementsByTagName('HEAD')[0] || document.getElementsByTagName('BODY')[0]).appendChild(s);
        }());
      }
    },

    initDisqus: function (config){
      disqus_config.params = config;
      if (this.loaded) {
        DISQUS.reset({
          reload: true
        });
      } else {
        (function() {
          var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
          dsq.src = 'http://' + disqus_shortname + '.disqus.com/embed.js';
          (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
        })();

        this.loaded = true;
      }
    },

    initShare: function(){
      var context = $('#shareme');
      context.find('.twitter-share').attr({
        'data-url': this.url,
        'data-text':this.title
      });

      context.find('.facebook-like').attr({
        'data-href': this.url,
        'href': 'http://www.facebook.com/sharer.php?u=' + this.url +'&t=' + this.title
      });

      context.find('.googleplus-one').attr({
        'href': 'https://plus.google.com/share?url=' + this.url,
        'data-href': this.url
      });

      Socialite.load(context);
    },

    updateMetaInfo: function(model){
      // Defaults
      this.title        = 'Blog - My online Playground';
      this.description  = 'Web Dev, Seminole living in Silicon Valley. Checkout my blog!';
      this.url          = window.location.href;

      if(model){
        this.title       = model.get('title');
        this.description = model.get('contentIntro');
      }

      $(document).attr('title', this.title);
      $('meta[name=description]').attr('content', this.description);
      $('meta[name=og\\:title]').attr('content', this.title);
      $('meta[name=og\\:description]').attr('content', this.description);
      $('meta[name=og\\:url]').attr('content', this.url);
    }
};

// Needs to be global :-/
var disqus_config = function disqus_config() {
  var config = disqus_config.params;
  this.page.identifier = config.identifier | null;
  this.page.url        = config.url | null ;
  this.page.title      = config.title | null;
};


/*
  ==========================================================================
    JS Native Enhancements
  ==========================================================================
*/
if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}

/*
  ==========================================================================
    jQuery Native Enhancements
  ==========================================================================
*/
$.fn.isOnScreen = function(offsetBottom){
    var win = $(window);

    if(!offsetBottom) offsetBottom = 0;
    var viewport = {
        top : win.scrollTop() + offsetBottom,
        left : win.scrollLeft()
    };

    viewport.right = viewport.left + win.width();
    viewport.bottom = viewport.top + win.height();

    var bounds = this.offset();
    bounds.right = bounds.left + this.outerWidth();
    bounds.bottom = bounds.top + this.outerHeight();

    return (!(viewport.right < bounds.left || viewport.left > bounds.right || viewport.bottom < bounds.top || viewport.top > bounds.bottom));

};

