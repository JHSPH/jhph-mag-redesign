

/*! responsive-nav.js 1.0.32
 * https://github.com/viljamis/responsive-nav.js
 * http://responsive-nav.com
 *
 * Copyright (c) 2014 @viljamis
 * Available under the MIT license
 */

(function (document, window, index) {

  "use strict";

  var responsiveNav = function (el, options) {

    var computed = !!window.getComputedStyle;
    
    // getComputedStyle polyfill
    if (!computed) {
      window.getComputedStyle = function(el) {
        this.el = el;
        this.getPropertyValue = function(prop) {
          var re = /(\-([a-z]){1})/g;
          if (prop === "float") {
            prop = "styleFloat";
          }
          if (re.test(prop)) {
            prop = prop.replace(re, function () {
              return arguments[2].toUpperCase();
            });
          }
          return el.currentStyle[prop] ? el.currentStyle[prop] : null;
        };
        return this;
      };
    }
    /* exported addEvent, removeEvent, getChildren, setAttributes, addClass, removeClass, forEach */
    // fn arg can be an object or a function, thanks to handleEvent
    // read more at: http://www.thecssninja.com/javascript/handleevent
    var addEvent = function (el, evt, fn, bubble) {
        if ("addEventListener" in el) {
          // BBOS6 doesn't support handleEvent, catch and polyfill
          try {
            el.addEventListener(evt, fn, bubble);
          } catch (e) {
            if (typeof fn === "object" && fn.handleEvent) {
              el.addEventListener(evt, function (e) {
                // Bind fn as this and set first arg as event object
                fn.handleEvent.call(fn, e);
              }, bubble);
            } else {
              throw e;
            }
          }
        } else if ("attachEvent" in el) {
          // check if the callback is an object and contains handleEvent
          if (typeof fn === "object" && fn.handleEvent) {
            el.attachEvent("on" + evt, function () {
              // Bind fn as this
              fn.handleEvent.call(fn);
            });
          } else {
            el.attachEvent("on" + evt, fn);
          }
        }
      },
    
      removeEvent = function (el, evt, fn, bubble) {
        if ("removeEventListener" in el) {
          try {
            el.removeEventListener(evt, fn, bubble);
          } catch (e) {
            if (typeof fn === "object" && fn.handleEvent) {
              el.removeEventListener(evt, function (e) {
                fn.handleEvent.call(fn, e);
              }, bubble);
            } else {
              throw e;
            }
          }
        } else if ("detachEvent" in el) {
          if (typeof fn === "object" && fn.handleEvent) {
            el.detachEvent("on" + evt, function () {
              fn.handleEvent.call(fn);
            });
          } else {
            el.detachEvent("on" + evt, fn);
          }
        }
      },
    
      getChildren = function (e) {
        if (e.children.length < 1) {
          throw new Error("The Nav container has no containing elements");
        }
        // Store all children in array
        var children = [];
        // Loop through children and store in array if child != TextNode
        for (var i = 0; i < e.children.length; i++) {
          if (e.children[i].nodeType === 1) {
            children.push(e.children[i]);
          }
        }
        return children;
      },
    
      setAttributes = function (el, attrs) {
        for (var key in attrs) {
          el.setAttribute(key, attrs[key]);
        }
      },
    
      addClass = function (el, cls) {
        if (el.className.indexOf(cls) !== 0) {
          el.className += " " + cls;
          el.className = el.className.replace(/(^\s*)|(\s*$)/g,"");
        }
      },
    
      removeClass = function (el, cls) {
        var reg = new RegExp("(\\s|^)" + cls + "(\\s|$)");
        el.className = el.className.replace(reg, " ").replace(/(^\s*)|(\s*$)/g,"");
      },
    
      // forEach method that passes back the stuff we need
      forEach = function (array, callback, scope) {
        for (var i = 0; i < array.length; i++) {
          callback.call(scope, i, array[i]);
        }
      };

    var nav,
      opts,
      navToggle,
      styleElement = document.createElement("style"),
      htmlEl = document.documentElement,
      hasAnimFinished,
      isMobile,
      navOpen;

    var ResponsiveNav = function (el, options) {
        var i;

        // Default options
        this.options = {
          animate: true,                    // Boolean: Use CSS3 transitions, true or false
          transition: 284,                  // Integer: Speed of the transition, in milliseconds
          label: "Menu",                    // String: Label for the navigation toggle
          insert: "before",                 // String: Insert the toggle before or after the navigation
          customToggle: "",                 // Selector: Specify the ID of a custom toggle
          closeOnNavClick: true,           // Boolean: Close the navigation when one of the links are clicked
          openPos: "relative",              // String: Position of the opened nav, relative or static
          navClass: "nav-collapse",         // String: Default CSS class. If changed, you need to edit the CSS too!
          navActiveClass: "js-nav-active",  // String: Class that is added to <html> element when nav is active
          jsClass: "js",                    // String: 'JS enabled' class which is added to <html> element
          init: function(){},               // Function: Init callback
          open: function(){},               // Function: Open callback
          close: function(){}               // Function: Close callback
        };

        // User defined options
        for (i in options) {
          this.options[i] = options[i];
        }

        // Adds "js" class for <html>
        addClass(htmlEl, this.options.jsClass);

        // Wrapper
        this.wrapperEl = el.replace("#", "");

        // Try selecting ID first
        if (document.getElementById(this.wrapperEl)) {
          this.wrapper = document.getElementById(this.wrapperEl);

        // If element with an ID doesn't exist, use querySelector
        } else if (document.querySelector(this.wrapperEl)) {
          this.wrapper = document.querySelector(this.wrapperEl);

        // If element doesn't exists, stop here.
        } else {
          throw new Error("The nav element you are trying to select doesn't exist");
        }

        // Inner wrapper
        this.wrapper.inner = getChildren(this.wrapper);

        // For minification
        opts = this.options;
        nav = this.wrapper;

        // Init
        this._init(this);
      };

    ResponsiveNav.prototype = {

      // Public methods
      destroy: function () {
        this._removeStyles();
        removeClass(nav, "closed");
        removeClass(nav, "opened");
        removeClass(nav, opts.navClass);
        removeClass(nav, opts.navClass + "-" + this.index);
        removeClass(htmlEl, opts.navActiveClass);
        nav.removeAttribute("style");
        nav.removeAttribute("aria-hidden");

        removeEvent(window, "resize", this, false);
        removeEvent(document.body, "touchmove", this, false);
        removeEvent(navToggle, "touchstart", this, false);
        removeEvent(navToggle, "touchend", this, false);
        removeEvent(navToggle, "mouseup", this, false);
        removeEvent(navToggle, "keyup", this, false);
        removeEvent(navToggle, "click", this, false);

        if (!opts.customToggle) {
          navToggle.parentNode.removeChild(navToggle);
        } else {
          navToggle.removeAttribute("aria-hidden");
        }
      },

      toggle: function () {
        if (hasAnimFinished === true) {
          if (!navOpen) {
            this.open();
          } else {
            this.close();
          }
        }
      },

      open: function () {
        if (!navOpen) {
          removeClass(nav, "closed");
          addClass(nav, "opened");
          addClass(htmlEl, opts.navActiveClass);
          addClass(navToggle, "active");
          nav.style.position = opts.openPos;
          setAttributes(nav, {"aria-hidden": "false"});
          navOpen = true;
          opts.open();
        }
      },

      close: function () {
        if (navOpen) {
          addClass(nav, "closed");
          removeClass(nav, "opened");
          removeClass(htmlEl, opts.navActiveClass);
          removeClass(navToggle, "active");
          setAttributes(nav, {"aria-hidden": "true"});

          if (opts.animate) {
            hasAnimFinished = false;
            setTimeout(function () {
              nav.style.position = "absolute";
              hasAnimFinished = true;
            }, opts.transition + 10);
          } else {
            nav.style.position = "absolute";
          }

          navOpen = false;
          opts.close();
        }
      },

      resize: function () {
        if (window.getComputedStyle(navToggle, null).getPropertyValue("display") !== "none") {

          isMobile = true;
          setAttributes(navToggle, {"aria-hidden": "false"});

          // If the navigation is hidden
          if (nav.className.match(/(^|\s)closed(\s|$)/)) {
            setAttributes(nav, {"aria-hidden": "true"});
            nav.style.position = "absolute";
          }

          this._createStyles();
          this._calcHeight();
        } else {

          isMobile = false;
          setAttributes(navToggle, {"aria-hidden": "true"});
          setAttributes(nav, {"aria-hidden": "false"});
          nav.style.position = opts.openPos;
          this._removeStyles();
        }
      },

      handleEvent: function (e) {
        var evt = e || window.event;

        switch (evt.type) {
        case "touchstart":
          this._onTouchStart(evt);
          break;
        case "touchmove":
          this._onTouchMove(evt);
          break;
        case "touchend":
        case "mouseup":
          this._onTouchEnd(evt);
          break;
        case "click":
          this._preventDefault(evt);
          break;
        case "keyup":
          this._onKeyUp(evt);
          break;
        case "resize":
          this.resize(evt);
          break;
        }
      },

      // Private methods
      _init: function () {
        this.index = index++;

        addClass(nav, opts.navClass);
        addClass(nav, opts.navClass + "-" + this.index);
        addClass(nav, "closed");
        hasAnimFinished = true;
        navOpen = false;

        this._closeOnNavClick();
        this._createToggle();
        this._transitions();
        this.resize();

        // IE8 hack
        var self = this;
        setTimeout(function () {
          self.resize();
        }, 20);

        addEvent(window, "resize", this, false);
        addEvent(document.body, "touchmove", this, false);
        addEvent(navToggle, "touchstart", this, false);
        addEvent(navToggle, "touchend", this, false);
        addEvent(navToggle, "mouseup", this, false);
        addEvent(navToggle, "keyup", this, false);
        addEvent(navToggle, "click", this, false);

        // Init callback
        opts.init();
      },

      _createStyles: function () {
        if (!styleElement.parentNode) {
          styleElement.type = "text/css";
          document.getElementsByTagName("head")[0].appendChild(styleElement);
        }
      },

      _removeStyles: function () {
        if (styleElement.parentNode) {
          styleElement.parentNode.removeChild(styleElement);
        }
      },

      _createToggle: function () {
        if (!opts.customToggle) {
          var toggle = document.createElement("a");
          toggle.innerHTML = opts.label;
          setAttributes(toggle, {
            "href": "#",
            "class": "nav-toggle"
          });

          if (opts.insert === "after") {
            nav.parentNode.insertBefore(toggle, nav.nextSibling);
          } else {
            nav.parentNode.insertBefore(toggle, nav);
          }

          navToggle = toggle;
        } else {
          var toggleEl = opts.customToggle.replace("#", "");

          if (document.getElementById(toggleEl)) {
            navToggle = document.getElementById(toggleEl);
          } else if (document.querySelector(toggleEl)) {
            navToggle = document.querySelector(toggleEl);
          } else {
            throw new Error("The custom nav toggle you are trying to select doesn't exist");
          }
        }
      },

      _closeOnNavClick: function () {
        if (opts.closeOnNavClick && "querySelectorAll" in document) {
          var links = nav.querySelectorAll("a"),
            self = this;
          forEach(links, function (i, el) {
            addEvent(links[i], "click", function () {
              if (isMobile) {
                self.toggle();
              }
            }, false);
          });
        }
      },

      _preventDefault: function(e) {
        if (e.preventDefault) {
          e.preventDefault();
          e.stopPropagation();
        } else {
          e.returnValue = false;
        }
      },

      _onTouchStart: function (e) {
        e.stopPropagation();
        if (opts.insert === "after") {
          addClass(document.body, "disable-pointer-events");
        }
        this.startX = e.touches[0].clientX;
        this.startY = e.touches[0].clientY;
        this.touchHasMoved = false;
        removeEvent(navToggle, "mouseup", this, false);
      },

      _onTouchMove: function (e) {
        if (Math.abs(e.touches[0].clientX - this.startX) > 10 ||
        Math.abs(e.touches[0].clientY - this.startY) > 10) {
          this.touchHasMoved = true;
        }
      },

      _onTouchEnd: function (e) {
        this._preventDefault(e);
        if (!this.touchHasMoved) {
          if (e.type === "touchend") {
            this.toggle();
            if (opts.insert === "after") {
              setTimeout(function () {
                removeClass(document.body, "disable-pointer-events");
              }, opts.transition + 300);
            }
            return;
          } else {
            var evt = e || window.event;
            // If it isn't a right click
            if (!(evt.which === 3 || evt.button === 2)) {
              this.toggle();
            }
          }
        }
      },

      _onKeyUp: function (e) {
        var evt = e || window.event;
        if (evt.keyCode === 13) {
          this.toggle();
        }
      },

      _transitions: function () {
        if (opts.animate) {
          var objStyle = nav.style,
            transition = "max-height " + opts.transition + "ms";

          objStyle.WebkitTransition = transition;
          objStyle.MozTransition = transition;
          objStyle.OTransition = transition;
          objStyle.transition = transition;
        }
      },

      _calcHeight: function () {
        var savedHeight = 0;
        for (var i = 0; i < nav.inner.length; i++) {
          savedHeight += nav.inner[i].offsetHeight;
        }
        var innerStyles = "." + opts.jsClass + " ." + opts.navClass + "-" + this.index + ".opened{max-height:" + savedHeight + "px}";

        if (styleElement.styleSheet) {
          styleElement.styleSheet.cssText = innerStyles;
        } else {
          styleElement.innerHTML = innerStyles;
        }

        innerStyles = "";
      }

    };

    return new ResponsiveNav(el, options);

  };

  window.responsiveNav = responsiveNav;

}(document, window, 0));

var nav = responsiveNav(".nav-collapse");


// BACK TO TOP BUTTON & SOCIAL BAR

$(document).scroll(function () {
    var y = $(this).scrollTop();
    if (y < 800) {
        $('.back-to-top, .social-bar').fadeOut();
    } else {
        $('.back-to-top, .social-bar').fadeIn();
    }
});
$("#to-top").click(function() {
    $('html, body').animate({
        scrollTop: $("#top").offset().top
    }, 1000);
});

/* ----------------------------------
jQuery Timelinr 0.9.54
tested with jQuery v1.6+

Copyright 2011, CSSLab.cl
Free under the MIT license.
http://www.opensource.org/licenses/mit-license.php

instructions: http://www.csslab.cl/2011/08/18/jquery-timelinr/
---------------------------------- */

jQuery.fn.timelinr = function(options){
  // default plugin settings
  settings = jQuery.extend({
    orientation:        'horizontal',   // value: horizontal | vertical, default to horizontal
    containerDiv:         '#timeline',    // value: any HTML tag or #id, default to #timeline
    datesDiv:           '#dates',     // value: any HTML tag or #id, default to #dates
    datesSelectedClass:     'selected',     // value: any class, default to selected
    datesSpeed:         'normal',     // value: integer between 100 and 1000 (recommended) or 'slow', 'normal' or 'fast'; default to normal
    issuesDiv:          '#issues',      // value: any HTML tag or #id, default to #issues
    issuesSelectedClass:    'selected',     // value: any class, default to selected
    issuesSpeed:        'fast',       // value: integer between 100 and 1000 (recommended) or 'slow', 'normal' or 'fast'; default to fast
    issuesTransparency:     0.2,        // value: integer between 0 and 1 (recommended), default to 0.2
    issuesTransparencySpeed:  500,        // value: integer between 100 and 1000 (recommended), default to 500 (normal)
    prevButton:         '#prev',      // value: any HTML tag or #id, default to #prev
    nextButton:         '#next',      // value: any HTML tag or #id, default to #next
    arrowKeys:          'false',      // value: true | false, default to false
    startAt:          1,          // value: integer, default to 1 (first)
    autoPlay:           'false',      // value: true | false, default to false
    autoPlayDirection:      'forward',      // value: forward | backward, default to forward
    autoPlayPause:        2000        // value: integer (1000 = 1 seg), default to 2000 (2segs)
  }, options);

  $(function(){
    // setting variables... many of them
    var howManyDates = $(settings.datesDiv+' li').length;
    var howManyIssues = $(settings.issuesDiv+' li').length;
    var currentDate = $(settings.datesDiv).find('a.'+settings.datesSelectedClass);
    var currentIssue = $(settings.issuesDiv).find('li.'+settings.issuesSelectedClass);
    var widthContainer = $(settings.containerDiv).width();
    var heightContainer = $(settings.containerDiv).height();
    var widthIssues = $(settings.issuesDiv).width();
    var heightIssues = $(settings.issuesDiv).height();
    var widthIssue = $(settings.issuesDiv+' li').width();
    var heightIssue = $(settings.issuesDiv+' li').height();
    var widthDates = $(settings.datesDiv).width();
    var heightDates = $(settings.datesDiv).height();
    var widthDate = $(settings.datesDiv+' li').width();
    var heightDate = $(settings.datesDiv+' li').height();
    // set positions!
    if(settings.orientation == 'horizontal') {  
      $(settings.issuesDiv).width(widthIssue*howManyIssues);
      $(settings.datesDiv).width(widthDate*howManyDates).css('marginLeft',widthContainer/2-widthDate/2);
      var defaultPositionDates = parseInt($(settings.datesDiv).css('marginLeft').substring(0,$(settings.datesDiv).css('marginLeft').indexOf('px')));
    } else if(settings.orientation == 'vertical') {
      $(settings.issuesDiv).height(heightIssue*howManyIssues);
      $(settings.datesDiv).height(heightDate*howManyDates).css('marginTop',heightContainer/2-heightDate/2);
      var defaultPositionDates = parseInt($(settings.datesDiv).css('marginTop').substring(0,$(settings.datesDiv).css('marginTop').indexOf('px')));
    }
    
    $(settings.datesDiv+' a').click(function(event){
      event.preventDefault();
      // first vars
      var whichIssue = $(this).text();
      var currentIndex = $(this).parent().prevAll().length;
      // moving the elements
      if(settings.orientation == 'horizontal') {
        $(settings.issuesDiv).animate({'marginLeft':-widthIssue*currentIndex},{queue:false, duration:settings.issuesSpeed});
      } else if(settings.orientation == 'vertical') {
        $(settings.issuesDiv).animate({'marginTop':-heightIssue*currentIndex},{queue:false, duration:settings.issuesSpeed});
      }
      $(settings.issuesDiv+' li').animate({'opacity':settings.issuesTransparency},{queue:false, duration:settings.issuesSpeed}).removeClass(settings.issuesSelectedClass).eq(currentIndex).addClass(settings.issuesSelectedClass).fadeTo(settings.issuesTransparencySpeed,1);
      // prev/next buttons now disappears on first/last issue | bugfix from 0.9.51: lower than 1 issue hide the arrows | bugfixed: arrows not showing when jumping from first to last date
      if(howManyDates == 1) {
        $(settings.prevButton+','+settings.nextButton).fadeOut('fast');
      } else if(howManyDates == 2) {
        if($(settings.issuesDiv+' li:first-child').hasClass(settings.issuesSelectedClass)) {
          $(settings.prevButton).fadeOut('fast');
          $(settings.nextButton).fadeIn('fast');
        } 
        else if($(settings.issuesDiv+' li:last-child').hasClass(settings.issuesSelectedClass)) {
          $(settings.nextButton).fadeOut('fast');
          $(settings.prevButton).fadeIn('fast');
        }
      } else {
        if( $(settings.issuesDiv+' li:first-child').hasClass(settings.issuesSelectedClass) ) {
          $(settings.nextButton).fadeIn('fast');
          $(settings.prevButton).fadeOut('fast');
        } 
        else if( $(settings.issuesDiv+' li:last-child').hasClass(settings.issuesSelectedClass) ) {
          $(settings.prevButton).fadeIn('fast');
          $(settings.nextButton).fadeOut('fast');
        }
        else {
          $(settings.nextButton+','+settings.prevButton).fadeIn('slow');
        } 
      }
      // now moving the dates
      $(settings.datesDiv+' a').removeClass(settings.datesSelectedClass);
      $(this).addClass(settings.datesSelectedClass);
      if(settings.orientation == 'horizontal') {
        $(settings.datesDiv).animate({'marginLeft':defaultPositionDates-(widthDate*currentIndex)},{queue:false, duration:'settings.datesSpeed'});
      } else if(settings.orientation == 'vertical') {
        $(settings.datesDiv).animate({'marginTop':defaultPositionDates-(heightDate*currentIndex)},{queue:false, duration:'settings.datesSpeed'});
      }
    });

    $(settings.nextButton).bind('click', function(event){
      event.preventDefault();
      // bugixed from 0.9.54: now the dates gets centered when there's too much dates.
      var currentIndex = $(settings.issuesDiv).find('li.'+settings.issuesSelectedClass).index();
      if(settings.orientation == 'horizontal') {
        var currentPositionIssues = parseInt($(settings.issuesDiv).css('marginLeft').substring(0,$(settings.issuesDiv).css('marginLeft').indexOf('px')));
        var currentIssueIndex = currentPositionIssues/widthIssue;
        var currentPositionDates = parseInt($(settings.datesDiv).css('marginLeft').substring(0,$(settings.datesDiv).css('marginLeft').indexOf('px')));
        var currentIssueDate = currentPositionDates-widthDate;
        if(currentPositionIssues <= -(widthIssue*howManyIssues-(widthIssue))) {
          $(settings.issuesDiv).stop();
          $(settings.datesDiv+' li:last-child a').click();
        } else {
          if (!$(settings.issuesDiv).is(':animated')) {
            // bugixed from 0.9.52: now the dates gets centered when there's too much dates.
            $(settings.datesDiv+' li').eq(currentIndex+1).find('a').trigger('click');
          }
        }
      } else if(settings.orientation == 'vertical') {
        var currentPositionIssues = parseInt($(settings.issuesDiv).css('marginTop').substring(0,$(settings.issuesDiv).css('marginTop').indexOf('px')));
        var currentIssueIndex = currentPositionIssues/heightIssue;
        var currentPositionDates = parseInt($(settings.datesDiv).css('marginTop').substring(0,$(settings.datesDiv).css('marginTop').indexOf('px')));
        var currentIssueDate = currentPositionDates-heightDate;
        if(currentPositionIssues <= -(heightIssue*howManyIssues-(heightIssue))) {
          $(settings.issuesDiv).stop();
          $(settings.datesDiv+' li:last-child a').click();
        } else {
          if (!$(settings.issuesDiv).is(':animated')) {
            // bugixed from 0.9.54: now the dates gets centered when there's too much dates.
            $(settings.datesDiv+' li').eq(currentIndex+1).find('a').trigger('click');
          }
        }
      }
      // prev/next buttons now disappears on first/last issue | bugfix from 0.9.51: lower than 1 issue hide the arrows
      if(howManyDates == 1) {
        $(settings.prevButton+','+settings.nextButton).fadeOut('fast');
      } else if(howManyDates == 2) {
        if($(settings.issuesDiv+' li:first-child').hasClass(settings.issuesSelectedClass)) {
          $(settings.prevButton).fadeOut('fast');
          $(settings.nextButton).fadeIn('fast');
        } 
        else if($(settings.issuesDiv+' li:last-child').hasClass(settings.issuesSelectedClass)) {
          $(settings.nextButton).fadeOut('fast');
          $(settings.prevButton).fadeIn('fast');
        }
      } else {
        if( $(settings.issuesDiv+' li:first-child').hasClass(settings.issuesSelectedClass) ) {
          $(settings.prevButton).fadeOut('fast');
        } 
        else if( $(settings.issuesDiv+' li:last-child').hasClass(settings.issuesSelectedClass) ) {
          $(settings.nextButton).fadeOut('fast');
        }
        else {
          $(settings.nextButton+','+settings.prevButton).fadeIn('slow');
        } 
      }
    });

    $(settings.prevButton).click(function(event){
      event.preventDefault();
      // bugixed from 0.9.54: now the dates gets centered when there's too much dates.
      var currentIndex = $(settings.issuesDiv).find('li.'+settings.issuesSelectedClass).index();
      if(settings.orientation == 'horizontal') {
        var currentPositionIssues = parseInt($(settings.issuesDiv).css('marginLeft').substring(0,$(settings.issuesDiv).css('marginLeft').indexOf('px')));
        var currentIssueIndex = currentPositionIssues/widthIssue;
        var currentPositionDates = parseInt($(settings.datesDiv).css('marginLeft').substring(0,$(settings.datesDiv).css('marginLeft').indexOf('px')));
        var currentIssueDate = currentPositionDates+widthDate;
        if(currentPositionIssues >= 0) {
          $(settings.issuesDiv).stop();
          $(settings.datesDiv+' li:first-child a').click();
        } else {
          if (!$(settings.issuesDiv).is(':animated')) {
            // bugixed from 0.9.54: now the dates gets centered when there's too much dates.
            $(settings.datesDiv+' li').eq(currentIndex-1).find('a').trigger('click');
          }
        }
      } else if(settings.orientation == 'vertical') {
        var currentPositionIssues = parseInt($(settings.issuesDiv).css('marginTop').substring(0,$(settings.issuesDiv).css('marginTop').indexOf('px')));
        var currentIssueIndex = currentPositionIssues/heightIssue;
        var currentPositionDates = parseInt($(settings.datesDiv).css('marginTop').substring(0,$(settings.datesDiv).css('marginTop').indexOf('px')));
        var currentIssueDate = currentPositionDates+heightDate;
        if(currentPositionIssues >= 0) {
          $(settings.issuesDiv).stop();
          $(settings.datesDiv+' li:first-child a').click();
        } else {
          if (!$(settings.issuesDiv).is(':animated')) {
            // bugixed from 0.9.54: now the dates gets centered when there's too much dates.
            $(settings.datesDiv+' li').eq(currentIndex-1).find('a').trigger('click');
          }
        }
      }
      // prev/next buttons now disappears on first/last issue | bugfix from 0.9.51: lower than 1 issue hide the arrows
      if(howManyDates == 1) {
        $(settings.prevButton+','+settings.nextButton).fadeOut('fast');
      } else if(howManyDates == 2) {
        if($(settings.issuesDiv+' li:first-child').hasClass(settings.issuesSelectedClass)) {
          $(settings.prevButton).fadeOut('fast');
          $(settings.nextButton).fadeIn('fast');
        } 
        else if($(settings.issuesDiv+' li:last-child').hasClass(settings.issuesSelectedClass)) {
          $(settings.nextButton).fadeOut('fast');
          $(settings.prevButton).fadeIn('fast');
        }
      } else {
        if( $(settings.issuesDiv+' li:first-child').hasClass(settings.issuesSelectedClass) ) {
          $(settings.prevButton).fadeOut('fast');
        } 
        else if( $(settings.issuesDiv+' li:last-child').hasClass(settings.issuesSelectedClass) ) {
          $(settings.nextButton).fadeOut('fast');
        }
        else {
          $(settings.nextButton+','+settings.prevButton).fadeIn('slow');
        } 
      }
    });
    // keyboard navigation, added since 0.9.1
    if(settings.arrowKeys=='true') {
      if(settings.orientation=='horizontal') {
        $(document).keydown(function(event){
          if (event.keyCode == 39) { 
               $(settings.nextButton).click();
            }
          if (event.keyCode == 37) { 
               $(settings.prevButton).click();
            }
        });
      } else if(settings.orientation=='vertical') {
        $(document).keydown(function(event){
          if (event.keyCode == 40) { 
               $(settings.nextButton).click();
            }
          if (event.keyCode == 38) { 
               $(settings.prevButton).click();
            }
        });
      }
    }
    // default position startAt, added since 0.9.3
    $(settings.datesDiv+' li').eq(settings.startAt-1).find('a').trigger('click');
    // autoPlay, added since 0.9.4
    if(settings.autoPlay == 'true') { 
      setInterval("autoPlay()", settings.autoPlayPause);
    }
  });
};

// autoPlay, added since 0.9.4
function autoPlay(){
  var currentDate = $(settings.datesDiv).find('a.'+settings.datesSelectedClass);
  if(settings.autoPlayDirection == 'forward') {
    if(currentDate.parent().is('li:last-child')) {
      $(settings.datesDiv+' li:first-child').find('a').trigger('click');
    } else {
      currentDate.parent().next().find('a').trigger('click');
    }
  } else if(settings.autoPlayDirection == 'backward') {
    if(currentDate.parent().is('li:first-child')) {
      $(settings.datesDiv+' li:last-child').find('a').trigger('click');
    } else {
      currentDate.parent().prev().find('a').trigger('click');
    }
  }
}
$(function(){
   $().timelinr();
});

var magSite = { 
  init: function() { 
    console.log('test');
    SearchBar.init(); 
  }
};

// Search Bar
var SearchBar = {
  __t: 0,

  init: function() {
    SearchBar.$form = $('.searchformContent');
    SearchBar.$parent = SearchBar.$form.parent();
    SearchBar.$text = SearchBar.$form.children('#q');
    
    SearchBar.$text.on({
      focus: function() {
        SearchBar.active();
      },
      blur: function() {
        SearchBar.inactive();
        SearchBar.clearTimer();
      },

      keyup: function() {
        SearchBar.clearTimer();
        SearchBar.timer();
      },

      mouseover: function() {
        SearchBar.clearTimer();
      },
      mouseout: function() {
        SearchBar.timer();
      }
    });
  },

  // Search stays
  active: function() { SearchBar.$parent.addClass('active'); },
  
  // Search goes byebye
  inactive: function() { 
    SearchBar.$parent.removeClass('active');
    SearchBar.clearTimer();
  },

  clearTimer: function() {
    if (typeof SearchBar.__t == 'undefined') {
      SearchBar.__t = 0;
      // console.log('__t was undefined');
    } else {
      clearTimeout(SearchBar.__t);
      // console.log('Clearing timeout ' + SearchBar.__t.toString());
    }
  },

  timer: function() {
    SearchBar.clearTimer();
    if( SearchBar.$parent.hasClass('active') ) {
      SearchBar.__t = setTimeout( function() {
        if ( SearchBar.$text.is(':focus') ) {
          SearchBar.$text.trigger('blur');
        }
        SearchBar.inactive();
        // console.log('Time is up!');
      }, 10000);
    }
  }
};

// Page Ready
jQuery(document).ready(function() {
  magSite.init();
});
