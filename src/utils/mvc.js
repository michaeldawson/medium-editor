// ------------------------------------------------
//  Simple MVC Framework
// ------------------------------------------------
//  Inspired by Backbone.js
// ------------------------------------------------

// Source: http://www.quirksmode.org/dom/events/
MediumEditor.BUILT_IN_EVENTS =
  ['blur','change','click','contextmenu','copy','cut','dblclick','error',
   'focus','focusin','focusout','hashchange','keydown','keypress','keyup',
   'load','mousedown','mousecenter','mouseleave','mousemove','mouseout',
   'mouseover','mouseup','mousewheel','paste','reset','resize','scroll',
   'select','submit','unload','wheel'];

MediumEditor.MVC = Class.extend({

  // Listen for a given event (can be either
  // built-in or custom) on the given object (obj)
  // and call the given function (fn) when it
  // occurs.
  //
  // Uses the event type to determine if it's a
  // built-in event or custom, so don't use custom
  // event names which already exist.
  //
  // Can be called as:
  //
  //   object.on('eventname', otherObject, function() { ... })
  //
  // Or:
  //
  //   object.on('eventname', function() { ... })
  //
  // The second method assumes the object to listen
  // to is this.
  //
  // Accepts multiple event types, separated by
  // spaces.
  on: function(type, obj, fn) {

    if (typeof obj === 'function') { fn = obj; obj = this; }
    var types = type.split(' ');
    for(var i = 0; i < types.length; i++) {
      type = types[i].toLowerCase();

      if (MediumEditor.BUILT_IN_EVENTS.indexOf(type) >= 0) {

        // Built in event - use the browsers default
        // event handling mechanisms.
        if (obj.addEventListener) {

          // Normal browsers
          obj.addEventListener(type, fn, false);

        } else if (obj.attachEvent) {

          // IE8
          obj["e" + type + fn] = fn;
          obj[type + fn] = function () {
           obj["e" + type + fn](window.event);
          }
          obj.attachEvent("on" + type, obj[type + fn]);

        }
      } else {

        // Custom event
        obj.eventListeners || (obj.eventListeners = {});
        if (!obj.eventListeners.hasOwnProperty(type)) obj.eventListeners[type] = [];
        obj.eventListeners[type].push(fn);
      }
    }
  },

  // Trigger the given event. The handler is passed
  // the same arguments as `trigger`, minus the
  // event type.

  trigger: function(type) {
    type = type.toLowerCase();
    this.eventListeners || (this.eventListeners = {});
    var args = Array.prototype.slice.call(arguments, 1);
    if (this.eventListeners.hasOwnProperty(type)) {
      var listeners = this.eventListeners[type];
      for (var i = 0; i < listeners.length; i++) {
        listeners[i].apply(this, args);
      }
    }
  },

  el: function() {
    return this._el;
  }
});

MediumEditor.Model = MediumEditor.MVC.extend({
  init: function(attrs) {}
});

MediumEditor.Collection = MediumEditor.MVC.extend({
  init: function(attrs) {
    this._items = [];
  },
  add: function(item) {
    this.insertAt(item, this.size());
  },
  insertAt: function(item, ix) {
    this._items.splice(ix, 0, item);
    this.trigger('add', item, ix);
  },
  size: function() {
    return this._items.length;
  },
  at: function(ix) {
    return this._items[ix];
  },
  remove: function(item) {
    var ix = this._items.indexOf(item)
    if (ix >= 0) this.removeAt(ix);
  },
  removeAt: function(ix) {
    var item = this.at(ix);
    this._items.splice(ix, 1);
    this.trigger('remove', item, ix);
  },
  clear: function() {
    this._items = [];
  },
  indexOf: function(obj) {
    return this._items.indexOf(obj);
  },
});

MediumEditor.View = MediumEditor.MVC.extend({
  init: function(attrs) {
    if (!attrs['model']) throw 'Medium Editor views require a model';
    this._model = attrs['model'];
  },
  // Override on to assume the default subject
  // object is the element, not the model
  on: function(type, obj, fn) {
    if (typeof obj === 'function') { fn = obj; obj = this._el; }
    this._super(type, obj, fn);
  },
  model: function() {
    return this._model;
  },
});
