// ---------------------------------------------
//  Medium Editor 1.0.0
// ---------------------------------------------
//  (c) 2014 Cameron Price-Austin
//  May be freely distributed under the MIT
//  license.
// ---------------------------------------------

// ---------------------------------------------
//  Polyfills
// ---------------------------------------------

// function.bind. Source: MDN
if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== "function") {
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    }

    var aArgs = Array.prototype.slice.call(arguments, 1),
        fToBind = this,
        fNOP = function () {},
        fBound = function () {
          return fToBind.apply(this instanceof fNOP && oThis
                 ? this
                 : oThis,
                 aArgs.concat(Array.prototype.slice.call(arguments)));
        };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}

// Array.indexOf - adapted from MDN and sourced from
// http://stackoverflow.com/a/3629211/889232
if (!Array.prototype.indexOf)
{
  Array.prototype.indexOf = function(elt /*, from*/)
  {
    var len = this.length >>> 0;

    var from = Number(arguments[1]) || 0;
    from = (from < 0)
         ? Math.ceil(from)
         : Math.floor(from);
    if (from < 0)
      from += len;

    for (; from < len; from++)
    {
      if (from in this &&
          this[from] === elt)
        return from;
    }
    return -1;
  };
}

// ---------------------------------------------
//  Class Structure
// ---------------------------------------------

// Simple JavaScript Inheritance
// By John Resig http://ejohn.org/
// MIT Licensed.
// Inspired by base2 and Prototype
(function(){
  var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

  // The base Class implementation (does nothing)
  this.Class = function(){};

  // Create a new Class that inherits from this class
  Class.extend = function(prop) {
    var _super = this.prototype;

    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;

    // Copy the properties over onto the new prototype
    for (var name in prop) {
      // Check if we're overwriting an existing function
      prototype[name] = typeof prop[name] == "function" &&
        typeof _super[name] == "function" && fnTest.test(prop[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;

            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];

            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);
            this._super = tmp;

            return ret;
          };
        })(name, prop[name]) :
        prop[name];
    }

    // The dummy class constructor
    function Class() {
      // All construction is actually done in the init method
      if ( !initializing && this.init )
        this.init.apply(this, arguments);
    }

    // Populate our constructed prototype object
    Class.prototype = prototype;

    // Enforce the constructor to be what we expect
    Class.prototype.constructor = Class;

    // And make this class extendable
    Class.extend = arguments.callee;

    return Class;
  };
})();

// ---------------------------------------------
//  Widget
// ---------------------------------------------

var MediumEditor = Class.extend({

  // Constructor - ensure the platform is supported,
  // then setup the element, models and views.
  init: function(selector, options) {

    // Ensure we can support this browser/device
    if (this._unsupportedPlatform()) return false;

    // Find the element - note we don't support
    // multiple elements at this time
    this.el = document.querySelector(selector);
    if (!this.el) return false;
    this.el.style.display = 'none';

    // Create the model
    var startingHTML = this.el.innerHTML || '';
    this.documentModel = new MediumEditor.DocumentModel({ html: startingHTML });

    // Create the editor view and insert it into
    // the page before the given element
    this.editorView = new MediumEditor.EditorView({ model: this.documentModel });
    this.el.parentNode.insertBefore(this.editorView.el, this.el);
  },

  // Check if the browser/device combination is
  // supported. Right now our only requirement
  // is querySelector (supported IE8 and above).
  _unsupportedPlatform: function() {
    return !document.querySelector;
  }
});

// ---------------------------------------------
//  Simple MVC Framework
// ---------------------------------------------

// Source: http://www.quirksmode.org/dom/events/
MediumEditor.BUILT_IN_EVENTS =
  ['blur','change','click','contextmenu','copy','cut','dblclick','error',
   'focus','focusin','focusout','hashchange','keydown','keypress','keyup',
   'load','mousedown','mousecenter','mouseleave','mousemove','mouseout',
   'mouseover','mouseup','mousewheel','paste','reset','resize','scroll',
   'select','submit','unload','wheel'];

MediumEditor.MVC = Class.extend({

  // Listen for a given event (can be either
  // built-in or custom) on the given object
  // (obj) and call the given function (fn)
  // when it occurs.
  //
  // Uses the event type to determine if
  // it's a built-in event or custom, so
  // don't use custom event names which
  // already exist.
  //
  // Can be called as:
  //
  //   object.on('eventname', otherObject, function() { ... })
  //
  // Or:
  //
  //   object.on('eventname', function() { ... })
  //
  // The second method assumes the object to
  // listen to is this.

  on: function(type, obj, fn) {

    if (typeof obj === 'function') { fn = obj; obj = this; }
    type = type.toLowerCase();

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
  },

  // Trigger the given event. At this point,
  // we don't support arguments, but we should.

  trigger: function(type) {
    type = type.toLowerCase();
    this.eventListeners || (this.eventListeners = {});
    if (this.eventListeners.hasOwnProperty(type)) {
      var listeners = this.eventListeners[type];
      for (var i = 0; i < listeners.length; i++) {
        listeners[i].call();
      }
    }
  }
});

MediumEditor.Model = MediumEditor.MVC.extend({
  init: function(attrs) {}
});

MediumEditor.Collection = MediumEditor.MVC.extend({
  init: function(attrs) {
    this.items = [];
  },
  add: function(item) {
    this.items.push(item);
  },
  size: function() {
    return this.items.length;
  },
  at: function(ix) {
    return this.items[ix];
  },
  remove: function(item) {
    var ix = this.items.indexOf(item)
    if (ix >= 0) this.removeAt(ix);
  },
  removeAt: function(ix) {
    this.items.splice(ix, 1);
  }
});

MediumEditor.View = MediumEditor.MVC.extend({
  init: function(attrs) {
    if (!attrs['model']) throw 'Medium Editor views require a model';
    this.model = attrs['model'];
  },
  // Override on to assume the default subject
  // object is the element, not the model
  on: function(type, obj, fn) {
    if (typeof obj === 'function') { fn = obj; obj = this.el; }
    this._super(type, obj, fn);
  }
});

// ---------------------------------------------
//  Models
// ---------------------------------------------

// The document model. A document is made up of
// blocks (which may be paragraphs, lists,
// images etc.)

MediumEditor.DocumentModel = MediumEditor.Model.extend({
  init: function(attrs) {
    this._super(attrs);
    this.children = new MediumEditor.BlockCollection({ model: this });
    this._parse(attrs['html'] || '');

    // TODO - temporary
    var p = new MediumEditor.ParagraphModel({ text: 'The quick brown fox jumped over the lazy dog' });
    this.children.add(p);
  },
  html: function() {
    return this.children.html();
  },
  _parse: function(html) {
    // TODO
  },
});

// Block models. Blocks belong to documents
// and contain the text and/or metadata
// needed to render them.

MediumEditor.BlockModel = MediumEditor.Model.extend({
  // Abstract
  init: function(attrs) {
    this._super(attrs);
    this.parent = null;       // Refers to the document model this block belongs to
  }
});

// The TextBlockModel is just to encapsulate
// all the common elements of blocks which
// contain text (paragraph, quote and
// heading).

MediumEditor.TextBlockModel = MediumEditor.Model.extend({
  // Abstract
  init: function(attrs) {
    this._super(attrs);
    this.text = attrs['text'] || '';
    this.markups = new MediumEditor.MarkupCollection();
  },
  insert: function(str, offset) {
    this.text = [this.text.slice(0, offset), str, this.text.slice(offset)].join('');
    this.trigger('changed');
  },
  html: function() {
    var text = this.markups.apply(this.text) || '<br>';
    return '<' + this.tag + '>' + text + '</' + this.tag + '>';
  },
});

MediumEditor.ParagraphModel = MediumEditor.TextBlockModel.extend({
  init: function(attrs) {
    this._super(attrs);
    this.tag = 'p';
  }
});

MediumEditor.HeadingModel = MediumEditor.TextBlockModel.extend({
  init: function(attrs) {
    this._super(attrs);
    this.tag = 'h3';
  }
});

MediumEditor.QuoteModel = MediumEditor.TextBlockModel.extend({
  init: function(attrs) {
    this._super(attrs);
    this.tag = 'blockquote';
  }
});

MediumEditor.UnorderedListModel = MediumEditor.BlockModel.extend({
  init: function(attrs) {
    this._super(attrs);
    this.text = '';
  },
});

MediumEditor.OrderedListModel = MediumEditor.BlockModel.extend({
  init: function(attrs) {
    this._super(attrs);
    this.text = '';
  },
});

MediumEditor.ImageModel = MediumEditor.BlockModel.extend({
  init: function(attrs) {
    this._super(attrs);
  },
});

MediumEditor.VideoModel = MediumEditor.BlockModel.extend({
  init: function(attrs) {
    this._super(attrs);
  },
});

MediumEditor.DividerModel = MediumEditor.BlockModel.extend({
  init: function(attrs) {
    this._super(attrs);
  },
});

// Markup models. Markup can describe formatting
// (such as strong or emphasis), or links. They
// have start and end values, which correspond
// to the start and end offsets of the text in
// the parent block to which they apply.

MediumEditor.MarkupModel = MediumEditor.Model.extend({
  // Abstract
  init: function(attrs) {
    this._super(attrs);
    this.start = attrs['start'] || 0;
    this.end = attrs['end'] || 0;
    if (this.start > this.end) {
      var temp = end;
      this.end = this.start;
      this.start = temp;
    } else if (this.start == this.end) {
      throw 'Start and end points of markup must be separate';
    }
  },
  touches: function(other) {
    return this.start <= other.end && this.end >= other.start;
  },
  covers: function(other) {
    return this.start <= other.start && this.end >= other.end;
  },
  openingTag: function() {
    return '<' + this.tag + '>';
  },
  closingTag: function() {
    return '</' + this.tag + '>';
  }
});

MediumEditor.StrongModel = MediumEditor.MarkupModel.extend({
  init: function(attrs) {
    this._super(attrs);
    this.tag = 'strong';
  },
  isSameClassAs: function(other) {
    return other instanceof MediumEditor.StrongModel;
  }
});

MediumEditor.EmphasisModel = MediumEditor.MarkupModel.extend({
  init: function(attrs) {
    this._super(attrs);
    this.tag = 'em';
  },
  isSameClassAs: function(other) {
    return other instanceof MediumEditor.EmphasisModel;
  }
});

MediumEditor.AnchorModel = MediumEditor.MarkupModel.extend({
  init: function(attrs) {
    this._super(attrs);
    this.tag = 'a';
    this.href = '';
  },
  isSameClassAs: function(other) {
    return other instanceof MediumEditor.AnchorModel;
  },
  openingTag: function() {
    return '<a href="' + this.href + '">';
  }
});

// ---------------------------------------------
//  Collections
// ---------------------------------------------

MediumEditor.BlockCollection = MediumEditor.Collection.extend({
  init: function(attrs) {
    this._super(attrs);
    this.model = attrs['model'];
  },
  add: function(item) {
    this._super(item);
    item.parent = this.model;
    this.on('changed', item, this._onBlockChanged.bind(this));
  },
  html: function() {
    var toReturn = '';
    for(var i = 0; i < this.size(); i++) {
      toReturn += this.at(i).html();
    }
    return toReturn;
  },
  _onBlockChanged: function() {
    this.model.trigger('changed');
  },
});

MediumEditor.MarkupCollection = MediumEditor.Collection.extend({

  // Normalise the collection after new markup is
  // added
  add: function(markup) {
    this._super(markup);
    this._normalise(markup);
  },

  // Given a plain text string, apply all markups
  // in this collection to produce and return a
  // HTML string.
  //
  // Note, we need to ensure precedence here. For
  // example, if a strong an an emphasis both
  // start at the same offset, we should return
  // '<strong><em> ...' rather than
  // '<em><strong> ...' (or the other way around
  // - doesn't matter, so long as it's
  // consistent).
  //
  // We also need to consider that markups of
  // different types in the collection can
  // overlap each other, but the produced HTML
  // needs to respect nesting rules.e.g.:
  //
  //   <strong>hi<em></strong>there</em>   <-- invalid

  apply: function(text) {

    // If there are no markups to apply, just
    // return the plain text
    if (this.size() == 0) return text;

    // For each item in the array, create an
    // 'inject' - an object representing an
    // instance where we need to inject some
    // HTML into the string. Each markup has
    // two injects - one for the opening and
    // one for the closing.
    var injects = [];
    for (var i = 0; i < this.size(); i++) {
      var markup = this.at(i);
      injects.push({ type: 'open', at: markup.start, obj: markup });
      injects.push({ type: 'close', at: markup.end, obj: markup });
    }

    // Sort the injects by the index they
    // occur at, then by the type, then
    // finally by the tag string
    injects.sort(function(a,b) {
      if (a.at != b.at) {
        return a.at - b.at;     // Sort by offset first
      } else {

        // Then by close ahead of open
        if (a.type[0] != b.type[0]) {
          return this._charComparison(a.type[0], b.type[0]);
        } else {

          // Then by the tag name
          var order = a.type == 'open' ? 1 : -1;                                    // Reverse order for closing tags
          return this._charComparison(a.obj.tag[0], b.obj.tag[0]) * order;
        }
      }
    });

    var toReturn = '';
    var textIx = 0;

    // Go through the injects, keeping track
    // of all the open tags
    var openTags = [];
    for (var i = 0; i < injects.length; i++) {
      var inject = injects[i];

      // Add the text up to this point and update
      // the text indx
      toReturn += text.substring(textIx, inject.at);
      textIx = inject.at;

      if (inject.type == 'open') {

        // Tag opening
        toReturn += inject.obj.openingTag();
        openTags.push(inject);

      } else {

        // Tag closing. Grab all the open tags which
        // end after this one.
        var temp = [];
        var c;
        while((c = openTags.pop()).tag != inject.tag) {
          temp.push(c);
        }

        // Close the other tags first
        for (var j = 0; j < temp.length; j++) {
          toReturn += temp[j].obj.closingTag();
        }

        // Now close this tag
        toReturn += inject.obj.closingTag();

        // Now put the other tags back
        while(temp.length) openTags.push(temp.pop());
      }
    }

    // Grab any remaining characters
    toReturn += text.substring(textIx);
    return toReturn
  },

  // Called after a markup is added to the
  // collection. Enforces rules:
  //
  //  1. If two markups of the same kind overlap,
  //     they should be compressed into a single
  //     markup
  //
  //     a) Unless those markups are links
  //        with difference hrefs, in which
  //        case they're separated
  //
  //  2. If two markups of the same kind are
  //     consecutive, they should be compressed
  //     into a single markup
  //
  //     a) Unless they're links with different
  //        hrefs

  _normalise: function(added) {

    // Get markups of the same kind and sort
    // them by start index
    var others = this._otherItemsOfSameKind(added);
    others.sort(function(a,b) { return a.start - b.start });

    // Run through the others
    for(var i = 0; i < others.length; i++) {
      var other = others[i];

      // If it overlaps with, or is consecutive to,
      // the new item ...
      if (other.touches(added)) {

        // If it's an anchor with a different href,
        // separate them
        if (other instanceof MediumEditor.AnchorModel && other.href != added.href) {

          // If the new markup covers the old markup
          // entirely, replace it
          if (added.covers(other)) {

            this.remove(other);

          } else {

            // Otherwise just separate them, with the new
            // markup taking precedence
            other.start = Math.max(other.start, added.end);
            other.end = Math.min(other.end, added.end);
          }

        } else {

          // Merge them
          this.remove(other);
          added.start= Math.min(other.start, added.start);
          added.end = Math.max(other.end, added.end);
        }
      }
    }
  },

  // Given a markup object, returns other markups
  // of the same kind in the collection
  _otherItemsOfSameKind: function(subject) {
    var toReturn = [];
    for (var i = 0; i < this.size(); i++) {
      var x = this.at(i);
      if (x.isSameClassAs(subject) && x != subject) toReturn.push(x);
    }
    return toReturn;
  },

  // Helper utility to compare two characters
  _charComparison: function(a,b) {
    if (a < b) {
      return -1;
    } else if (a > b) {
      return 1;
    } else {
      return 0;
    }
  }

});

// ---------------------------------------------
//  Views
// ---------------------------------------------

MediumEditor.EditorView = MediumEditor.View.extend({
  init: function(attrs) {
    this._super(attrs);
    this.selection = new MediumEditor.NullSelection();

    // Create the editor view element
    this.el = document.createElement('div');
    this.el.className = 'medium-editor';

    // Create the caret element
    this.caret = document.createElement('div');
    this.caret.className = 'medium-editor-caret';
    this.caret.style.display = 'none';
    this.el.appendChild(this.caret);

    // Register listeners. Start with the click
    // event for selection. Note, we listen on
    // the document instead of the element
    // because the user may mousedown on the
    // element but mouseup outside it (in the
    // case of a range selection). They may
    // also click outside the editor (in which
    // case we set a null selection)
    this.on('click', document, this._onClick.bind(this));

    // Listen to all key events - if we have
    // focus, we'll handle those events.
    this.on('keypress', document, this._onKeyPress.bind(this));

    // Add a document view as a child
    this.documentView = new MediumEditor.DocumentView({ model: this.model });
    this.el.appendChild(this.documentView.el);
  },

  _onClick: function(e) {
    var selection = MediumEditor.Selection.fromClick({
      documentView:     this.documentView,
      event:            e,
    });
    this._setSelection(selection);
  },

  _onKeyPress: function(e) {

    if (!(this.selection instanceof MediumEditor.NullSelection)) {
      var char = String.fromCharCode(parseInt(e.keyIdentifier.substring(2),16))
      if (!e.shiftKey) char = char.toLowerCase();       // The key code is always the uppercase equivalent
      var block = this.selection.block;
      block.insert(char, this.selection.offset);
      this.selection.offset++;
      this._positionCaret();
    }
  },

  _setSelection: function(selection) {
    this.selection = selection;
    this._positionCaret();
  },

  _positionCaret: function() {
    if (this.selection instanceof MediumEditor.CaretSelection) {
      var rect = this.selection.position();
      this.caret.style.display = 'block';
      this.caret.style.top = rect.top + 'px';
      this.caret.style.left = rect.left + 'px';
    } else {
      this.caret.style.display = 'none';
    }
  }
});

// The document view
MediumEditor.DocumentView = MediumEditor.View.extend({
  init: function(attrs) {
    this._super(attrs);

    // Create the document view element
    this.el = document.createElement('div');
    this.el.className = 'medium-editor-document';

    // Listen for changes
    this.on('changed', this.model, this._onChanged.bind(this));

    // Do an initial render
    this._render();
  },

  _onChanged: function() {
    this._render();
  },

  // Set the HTML - note we could use sub-views
  // here for the blocks, but we want the HTML
  // produced by the document model and HTML
  // displayed in the editor to be identical.
  _render: function() {
    this.el.innerHTML = this.model.html();
  }
});

// ---------------------------------------------
//  Selection
// ---------------------------------------------

MediumEditor.Selection = Class.extend({
  // Abstract
});

MediumEditor.NullSelection = MediumEditor.Selection.extend({});

MediumEditor.CaretSelection = MediumEditor.Selection.extend({
  init: function(attrs) {
    this.documentView = attrs['documentView'];
    if (!this.documentView) throw 'CaretSelection requires a document view';
    this.offset = attrs['offset'] || 0;
    this.block = attrs['block'] || null;
  },
  position: function() {

    // Get the DOM equivalents from the block
    var domInfo = MediumEditor.Selection._modelToNode(this.block, this.offset, this.documentView);
    var node = domInfo.node;
    var offset = domInfo.offset;
    var documentRect = this.documentView.el.getBoundingClientRect();

    if (window.getSelection) {

      // Normal browsers
      var sel = window.getSelection();
      var range = sel.getRangeAt(0);
      if (!range) {
        range = document.createRange();
        sel.addRange(range);
      }
      range.setStart(node, offset);
      range.setEnd(node, offset);
      var rect = range.getBoundingClientRect();
      var top = rect.top;
      var left = rect.left;

      // Occassionally, this returns [0,0,0,0] (see
      // http://stackoverflow.com/a/8475824/889232). If
      // so, fall back to inserting then removing a
      // temporary element (source
      // http://stackoverflow.com/a/6847328/889232)

      if (top == 0 && left == 0) {
        var span = document.createElement("span");

        // Ensure span has dimensions and position by
        // adding a zero-width space character
        span.appendChild(document.createTextNode("\u200b"));
        range.insertNode(span);
        rect = span.getClientRects()[0];
        top = rect.top;
        left = rect.left;
        var spanParent = span.parentNode;
        spanParent.removeChild(span);

        // Glue any broken text nodes back together
        spanParent.normalize();
      }

      return { top: top - documentRect.top, left: left - documentRect.left };
    }
    else if (document.selection) {

      // IE8
      var sel = document.selection;
      var range = sel.createRange();
      range.setStart(node, offset);
      range.setEnd(node, offset);
      return { top: range.offsetTop - documentRect.top, left: range.offsetLeft - documentRect.left };
    }
  }
});

MediumEditor.RangeSelection = MediumEditor.Selection.extend({
  init: function(attrs) {
    this.startOffset = attrs['start'] || 0;
    this.endOffset = attrs['end'] || 0;
    this.startBlock = attrs['startBlock'] || null;
    this.endBlock = attrs['endBlock'] || null;
  }
});

MediumEditor.ImageSelection = MediumEditor.Selection.extend({
  init: function(attrs) {
    this.block = attrs['block'] || null;
  }
});

MediumEditor.VideoSelection = MediumEditor.Selection.extend({
  init: function(attrs) {
    this.block = attrs['block'] || null;
  }
});

// Static selection constructors

// Create a selection from a click event. This
// requires a couple of helper functions to
// support IE8.

MediumEditor.Selection.fromClick = function(attrs) {

  var e = attrs['event'] || window.event;
  var target = e.target || e.srcElement;

  // If click is outside this view ...
  if (!MediumEditor.Selection._isAncestorOf(target, attrs['documentView'].el)) {
    return new MediumEditor.NullSelection();
  }

  var startOffset, endOffset, startNode, endNode;

  if (window.getSelection) {

    // Normal browsers
    var sel = window.getSelection();
    startOffset = sel.anchorOffset;
    endOffset = sel.focusOffset;
    startNode = sel.anchorNode;
    endNode = sel.focusNode;

  } else {

    // IE8
    var sel = document.selection;
    var range = sel.createRange();
    var startInfo = MediumEditor.Selection._ieSelectionInfo(range, 'start');
    var endInfo = MediumEditor.Selection._ieSelectionInfo(range, 'end');
    startOffset = startInfo.offset;
    endOffset = endInfo.offset;
    startNode = startInfo.node;
    endNode = endInfo.node;
  }

  if (startNode == endNode && startOffset == endOffset) {

    // Caret selection
    return new MediumEditor.CaretSelection({
      documentView: attrs['documentView'],
      offset:       startOffset,
      block:        MediumEditor.Selection._nodeToModel(startNode, attrs['documentView'])
    });

  } else {

    // Range selection
    return new MediumEditor.CaretSelection({
      startOffset:  startOffset,
      endOffset:    endOffset,
      startBlock:   MediumEditor.Selection._nodeToModel(startNode, attrs['documentView']),
      endBlock:     MediumEditor.Selection._nodeToModel(endNode, attrs['documentView'])
    });
  }

};

// Selection helper functions

MediumEditor.Selection._nodeToModel = function(node, documentView) {

  // Walk back up the DOM tree until we find the
  // document, storing each node as we go
  var nodes = [];
  do {
    nodes.push(node);
    node = node.parentNode;
  } while (node != documentView.el);

  // Now walk back down the model one level
  // using the element index
  var model = documentView.model;
  var node = nodes.pop();
  var indexWithinParent = Array.prototype.indexOf.call(node.parentNode.childNodes, node);
  return model.children.at(indexWithinParent);
};

MediumEditor.Selection._modelToNode = function(block, offset, documentView) {

  // Get the DOM element for the block
  var indexWithinParent = Array.prototype.indexOf.call(documentView.model.children.items, block);
  var domBlock = documentView.el.childNodes[indexWithinParent];

  // Now just progress through them until we reach
  // the offset
  var current = domBlock.childNodes[0];
  while (offset > current.textContent.length) {
    current = current.nextSibling;
    offset -= current.textContent.length;
  }
  return { node: current, offset: offset };
};

// Does the editor contain the given node?
MediumEditor.Selection._isAncestorOf = function(descendent, ancestor) {
  if (ancestor == descendent) {
    return true;
  } else if (!descendent.parentNode || descendent.parentNode.nodeType != 1) {
    return false;
  } else {
    return MediumEditor.Selection._isAncestorOf(descendent.parentNode, ancestor);
  }
};

// Given a range and a string value indicating
// whether we're querying the start or end of
// the range, return an object with properties
// `node` and `offset` representing the DOM
// node and offset at that end of the range.
// This is a polyfill for IE8, adapted from
// https://gist.github.com/Munawwar/1115251

MediumEditor.Selection._ieSelectionInfo = function(range, whichEnd) {
  if(!range) return null;
  whichEnd = whichEnd.toLowerCase();
  var rangeCopy = range.duplicate(),                  // Create two copies
      rangeObj  = range.duplicate();
  rangeCopy.collapse(whichEnd == 'start');            // Collapse the range to either the start or the end

  // moveToElementText throws a fit if the user
  // clicks an input element
  var parentElement = rangeCopy.parentElement();
  if (parentElement instanceof HTMLInputElement) return null;

  // IE8 can't have the selection end at the zeroth
  // index of the parentElement's first text node.
  rangeObj.moveToElementText(parentElement);          // Select all text of parentElement
  rangeObj.setEndPoint('EndToEnd', rangeCopy);        // Move end point to rangeCopy

  // Now traverse through sibling nodes to find the
  // exact node and the selection's offset.
  return MediumEditor.Selection._ieFindTextNode(parentElement.firstChild, rangeObj.text);
};

// Given a node and some text, iterate through it
// and its siblings until we find a text node
// which matches the given text.
MediumEditor.Selection._ieFindTextNode = function(node, text) {

  // Iterate through all the child text nodes and
  // check for matches. As we go through each text
  // node keep removing the text value (substring)
  // from the beginning of the text variable.
  do {
    if(node.nodeType == 3) {              // Text node
      var find = node.nodeValue;
      if (text.length > 0 && text.indexOf(find) === 0 && text !== find) { //text==find is a special case
        text = text.substring(find.length);
      } else {
        return {
          node:   node,
          offset: text.length
        };
      }
    } else if (node.nodeType === 1) {     // Element node
      var range = document.body.createTextRange();
      range.moveToElementText(node);
      text = text.substring(range.text.length);
    }
  } while ((node = node.nextSibling));
  return null;
};







// // ---------------------------------------------
// //  Selection
// // ---------------------------------------------
//
// // The selection object. A selection can be
// // none, a caret, a range (spanning multiple
// // models), an image or a video.
// //
// // The selection can be created directly (by
// // passing in the start and end models and their
// // offsets), or by using the static constructor
// // helpers below.
//
// MediumEditor.Selection = function(attrs) {
//
//   // Instance members, with their default values
//   this.documentModel = null;
//   this.documentView = null;
//   this.startNode = null;
//   this.startOffset = 0;
//   this.endNode = null;
//   this.endOffset = 0;
//
//   // Automatically determine type
//   if (attrs == null) {
//     this.type = 'none';
//   } else {
//     this.documentModel = attrs['documentModel'];
//     this.documentView = attrs['documentView'];
//     this.startNode = attrs['startNode'];
//     this.startOffset = attrs['startOffset'];
//     this.endNode = attrs['endNode'];
//     this.endOffset = attrs['endOffset'];
//     this.type = this.startNode == this.endNode ? 'caret' : 'range';
//   }
// }
//
// // Create and return an empty selection
//
// MediumEditor.Selection.none = function() {
//   return new MediumEditor.Selection();
// };
//
// // Create a selection from DOM nodes and
// // offsets. Requires the document model and
// // view, the start and end DOM nodes and
// // their relevant offsets. Converts to model
// // space and returns the selection.
//
// MediumEditor.Selection.fromDOM = function(attrs) {
//   return new MediumEditor.Selection({
//     documentModel:  attrs['documentModel'],
//     documentView:   attrs['documentView'],
//     startNode:      MediumEditor.Selection._mapDOMToModel(attrs['startNode'], attrs['documentModel'], attrs['documentView']),
//     startOffset:    attrs['startOffset'],
//     endNode:        MediumEditor.Selection._mapDOMToModel(attrs['endNode'], attrs['documentModel'], attrs['documentView']),
//     endOffset:      attrs['endOffset']
//   });
// };
//
// MediumEditor.Selection._mapDOMToModel = function(domNode, documentModel, documentView) {
//
//   // Walk back up the DOM tree until we find the
//   // document, storing each node as we go
//   var nodes = [];
//   do {
//     nodes.push(domNode);
//     domNode = domNode.parentNode;
//   } while (domNode != documentView.el);
//
//   // Now walk back down the document model,
//   // using the element indexes.
//   var model = documentModel;
//   for(var i = nodes.length - 1; i >= 0; i--) {
//     var node = nodes[i];
//     var indexWithinParent = Array.prototype.indexOf.call(node.parentNode.childNodes, node);
//     model = model.children.at(indexWithinParent);
//   }
//
//   return model;
// };
//
// MediumEditor.Selection._mapModelToDOM = function(nodeModel, documentModel, documentView) {
//
//   // Walk back up the model tree until we find the
//   // root, storing each model as we go
//   var models = [];
//   do {
//     models.push(nodeModel);
//     nodeModel = nodeModel.parent;
//   } while (nodeModel != documentModel);
//
//   // Now walk back down the DOM tree, using the
//   // element indexes.
//   var domNode = documentView.el;
//   for(var i = models.length - 1; i >= 0; i--) {
//     var model = models[i];
//     var indexWithinParent = Array.prototype.indexOf.call(model.parent.children.items, model);
//     domNode = domNode.childNodes[indexWithinParent];
//   }
//
//   return domNode;
// };
//
// // Create a selection from a click event. This
// // requires a couple of helper functions to
// // support IE8.
//
// MediumEditor.Selection.fromClick = function(attrs) {
//
//   var e = attrs['event'] || window.event;
//   var target = e.target || e.srcElement;
//   if (!MediumEditor.Selection._isAncestorOf(target, attrs['documentView'].el)) return MediumEditor.Selection.none();
//
//   if (window.getSelection) {
//
//     // Normal browsers
//     var sel = window.getSelection();
//     return MediumEditor.Selection.fromDOM({
//       documentModel:  attrs['documentModel'],
//       documentView:   attrs['documentView'],
//       startNode:      sel.anchorNode,
//       startOffset:    sel.anchorOffset,
//       endNode:        sel.focusNode,
//       endOffset:      sel.focusOffset
//     });
//
//   } else {
//
//     // IE8
//     var sel = document.selection;
//     var range = sel.createRange();
//     var startInfo = MediumEditor.Selection._ieSelectionInfo(range, 'start');
//     var endInfo = MediumEditor.Selection._ieSelectionInfo(range, 'end');
//     return MediumEditor.Selection.fromDOM({
//       documentModel:  attrs['documentModel'],
//       documentView:   attrs['documentView'],
//       startNode:      startInfo.node,
//       startOffset:    startInfo.offset,
//       endNode:        endInfo.node,
//       endOffset:      endInfo.offset
//     });
//   }
// };
//
// // Does the editor contain the given node?
// MediumEditor.Selection._isAncestorOf = function(descendent, ancestor) {
//   if (ancestor == descendent) {
//     return true;
//   } else if (!descendent.parentNode || descendent.parentNode.nodeType != 1) {
//     return false;
//   } else {
//     return MediumEditor.Selection._isAncestorOf(descendent.parentNode, ancestor);
//   }
// };
//
// // Given a range and a string value indicating
// // whether we're querying the start or end of
// // the range, return an object with properties
// // `node` and `offset` representing the DOM
// // node and offset at that end of the range.
// // This is a polyfill for IE8, adapted from
// // https://gist.github.com/Munawwar/1115251
//
// MediumEditor.Selection._ieSelectionInfo = function(range, whichEnd) {
//   if(!range) return null;
//   whichEnd = whichEnd.toLowerCase();
//   var rangeCopy = range.duplicate(),                  // Create two copies
//       rangeObj  = range.duplicate();
//   rangeCopy.collapse(whichEnd == 'start');            // Collapse the range to either the start or the end
//
//   // moveToElementText throws a fit if the user
//   // clicks an input element
//   var parentElement = rangeCopy.parentElement();
//   if (parentElement instanceof HTMLInputElement) return null;
//
//   // IE8 can't have the selection end at the zeroth
//   // index of the parentElement's first text node.
//   rangeObj.moveToElementText(parentElement);          // Select all text of parentElement
//   rangeObj.setEndPoint('EndToEnd', rangeCopy);        // Move end point to rangeCopy
//
//   // Now traverse through sibling nodes to find the
//   // exact node and the selection's offset.
//   return MediumEditor.Selection._ieFindTextNode(parentElement.firstChild, rangeObj.text);
// };
//
// // Given a node and some text, iterate through it
// // and its siblings until we find a text node
// // which matches the given text.
// MediumEditor.Selection._ieFindTextNode = function(node, text) {
//
//   // Iterate through all the child text nodes and
//   // check for matches. As we go through each text
//   // node keep removing the text value (substring)
//   // from the beginning of the text variable.
//   do {
//     if(node.nodeType == 3) {              // Text node
//       var find = node.nodeValue;
//       if (text.length > 0 && text.indexOf(find) === 0 && text !== find) { //text==find is a special case
//         text = text.substring(find.length);
//       } else {
//         return {
//           node:   node,
//           offset: text.length
//         };
//       }
//     } else if (node.nodeType === 1) {     // Element node
//       var range = document.body.createTextRange();
//       range.moveToElementText(node);
//       text = text.substring(range.text.length);
//     }
//   } while ((node = node.nextSibling));
//   return null;
// };
//
// // Instance methods on the selection object
//
// MediumEditor.Selection.prototype = {
//   next: function() {
//     // TODO
//   },
//   prev: function() {
//     // TODO
//   },
//   offset: function() {
//
//     // This really only makes sense for caret
//     if (this.type != 'caret') return;
//
//     // Get the DOM equivalents from the node models
//     var domStart = MediumEditor.Selection._mapModelToDOM(this.startNode, this.documentModel, this.documentView);
//     var domEnd = MediumEditor.Selection._mapModelToDOM(this.endNode, this.documentModel, this.documentView);
//     var documentRect = this.documentView.el.getBoundingClientRect();
//
//     if (window.getSelection) {
//
//       // Normal browsers
//       var sel = window.getSelection();
//       var range = sel.getRangeAt(0);
//       if (!range) {
//         range = document.createRange();
//         sel.addRange(range);
//       }
//       range.setStart(domStart, this.startOffset);
//       range.setEnd(domEnd, this.endOffset);
//       var rect = range.getBoundingClientRect();
//       var top = rect.top;
//       var left = rect.left;
//
//       // Occassionally, this returns [0,0,0,0] (see
//       // http://stackoverflow.com/a/8475824/889232). If
//       // so, fall back to inserting then removing a
//       // temporary element (source
//       // http://stackoverflow.com/a/6847328/889232)
//
//       if (top == 0 && left == 0) {
//         var span = document.createElement("span");
//
//         // Ensure span has dimensions and position by
//         // adding a zero-width space character
//         span.appendChild(document.createTextNode("\u200b"));
//         range.insertNode(span);
//         rect = span.getClientRects()[0];
//         top = rect.top;
//         left = rect.left;
//         var spanParent = span.parentNode;
//         spanParent.removeChild(span);
//
//         // Glue any broken text nodes back together
//         spanParent.normalize();
//       }
//
//       return { top: top - documentRect.top, left: left - documentRect.left };
//     }
//     else if (document.selection) {
//
//       // IE8
//       var sel = document.selection;
//       var range = sel.createRange();
//       range.setStart(domStart, this.startOffset);
//       range.setEnd(domEnd, this.endOffset);
//       return { top: range.offsetTop - documentRect.top, left: range.offsetLeft - documentRect.left };
//     }
//   },
// };




















































// The editor view
// MediumEditor.EditorView = MediumEditor.View.extend({
//
//   caret:                 null,                                  // The caret element
//   selection:             MediumEditor.Selection.none(),         // The selection object (defaults to none)
//
//   initialise: function(attrs) {
//
//     // Create the editor view element
//     this.el = document.createElement('div');
//     this.el.className = 'medium-editor';
//
//     // Create the caret element
//     this.caret = document.createElement('div');
//     this.caret.className = 'medium-editor-caret';
//     this.caret.style.display = 'none';
//     this.el.appendChild(this.caret);
//
//     // Register listeners. Start with the click
//     // event for selection. Note, we listen on
//     // the document instead of the element
//     // because the user may mousedown on the
//     // element but mouseup outside it (in the
//     // case of a range selection).
//     this.on('click', document, this._onClick.bind(this));
//
//     // Listen to all key events - if we have
//     // focus, we'll handle those events.
//     this.on('keypress', document, this._onKeyDown.bind(this));
//
//     // Add a document view as a child
//     this.documentView = new MediumEditor.DocumentView({ model: this.model });
//     this.el.appendChild(this.documentView.el);
//   },
//
//   _onClick: function(e) {
//     var selection = MediumEditor.Selection.fromClick({
//       documentModel:    this.model,
//       documentView:     this.documentView,
//       event:            e,
//     });
//     this._setSelection(selection);
//   },
//
//   _setSelection: function(selection) {
//     this.selection = selection;
//     this._positionCaret();
//   },
//
//   _positionCaret: function() {
//     if (this.selection.type == 'caret') {
//       var offset = this.selection.offset();
//       this.caret.style.display = 'block';
//       this.caret.style.top = offset.top + 'px';
//       this.caret.style.left = offset.left + 'px';
//     } else {
//       this.caret.style.display = 'none';
//     }
//   },
//
//   _hasFocus: function() {
//     return this.selection.type != 'none';
//   },
//
//   _onKeyDown: function(e) {
//     if (this._hasFocus()) {
//
//       switch(e.which) {
//         case 9:             // Tab
//         case 16:            // Shift
//         case 17:            // Ctrl
//         case 18:            // Alt
//         case 19:            // Pause/break
//         case 20:            // Caps lock
//         case 27:            // Escape
//         case 45:            // Insert
//         case 91:            // Left window key
//         case 92:            // Right window key
//           // No effect
//           break;
//         case 8:             // Backspace
//           // TODO
//           break;
//         case 13:            // Enter
//           // TODO
//           break;
//         case 33:            // Page up
//           // TODO
//           break;
//         case 34:            // Page down
//           // TODO
//           break;
//         case 35:            // End
//           // TODO
//           break;
//         case 26:            // Home
//           // TODO
//           break;
//         case 37:            // Left arrow
//           // TODO
//           break;
//         case 38:            // Up arrow
//           // TODO
//           break;
//         case 39:            // Right arrow
//           // TODO
//           break;
//         case 40:            // Down arrow
//           // TODO
//           break;
//         case 46:            // Delete
//           // TODO
//           break;
//         default:            // Any other key
//           if (this.selection.type == 'caret') {
//             //var char = String.fromCharCode(e.which);
//             //var char = e.keyIdentifier;
//             var char = String.fromCharCode(parseInt(e.keyIdentifier.substring(2),16))
//             if (!e.shiftKey) char = char.toLowerCase();       // The key code is always the uppercase equivalent
//             var model = this.selection.startNode;
//             model.insert(char, this.selection.startOffset);
//             this.selection.startOffset++;
//             this.selection.endOffset++;
//             this._positionCaret();
//           }
//       }
//     }
//   }
//
// });
//
// // The document view
// MediumEditor.DocumentView = MediumEditor.View.extend({
//
//   initialise: function(attrs) {
//
//     // Create the document view element
//     this.el = document.createElement('div');
//     this.el.className = 'medium-editor-document';
//
//     // Set the HTML - note we could use sub-views
//     // here for the blocks, but we want the HTML
//     // produced by the document model and HTML
//     // displayed in the editor to be identical.
//     this.el.innerHTML = this.model.html();
//
//     // Re-render if the document model is changed.
//     this.on('changed', this.model, this._onModelChanged.bind(this));
//   },
//
//   // Whenever the model is changed, re-render
//   _onModelChanged: function() {
//     this._render();
//   },
//
//   // Very simple render method - just set the
//   // HTML of the element to the HTML generated by
//   // the model. That way we keep the model data
//   // and its representation as close together as
//   // possible.
//   _render: function() {
//     this.el.innerHTML = this.model.html()
//   }
//
// });


//
// // ---------------------------------------------
// //  Simple MVC Framework
// // ---------------------------------------------
// //  Most of this is adapted (and severely
// //  stripped down) from Backbone.js and
// //  Underscore. We could just have those as
// //  dependencies, but we're aiming to be
// //  dependecy-free, plus there's a lot of stuff
// //  those libraries do which we don't need.
// // ---------------------------------------------
//
// // Source: http://www.quirksmode.org/dom/events/
// MediumEditor.BUILT_IN_EVENTS =
//   ['blur','change','click','contextmenu','copy','cut','dblclick','error',
//    'focus','focusin','focusout','hashchange','keydown','keypress','keyup',
//    'load','mousedown','mousecenter','mouseleave','mousemove','mouseout',
//    'mouseover','mouseup','mousewheel','paste','reset','resize','scroll',
//    'select','submit','unload','wheel'];
//
// // Event handling functions. These will be
// // available to all models, collections and
// // views.
//
// MediumEditor.Events = {
//
//   // Listen for a given event (can be either
//   // built-in or custom) on the given object
//   // (obj) and call the given function (fn)
//   // when it occurs.
//   //
//   // Uses the event type to determine if
//   // it's a built-in event or custom, so
//   // don't use custom event names which
//   // already exist.
//   //
//   // Can be called as:
//   //
//   //   object.on('eventname', otherObject, function() { ... })
//   //
//   // Or:
//   //
//   //   object.on('eventname', function() { ... })
//   //
//   // The second method assumes the object to
//   // listen to is this.
//
//   on: function(type, obj, fn) {
//
//     if (typeof obj === 'function') { fn = obj; obj = this; }
//     type = type.toLowerCase();
//
//     if (MediumEditor.BUILT_IN_EVENTS.indexOf(type) >= 0) {
//
//       // Built in event - use the browsers default
//       // event handling mechanisms.
//       if (obj.addEventListener) {
//
//         // Normal browsers
//         obj.addEventListener(type, fn, false);
//
//       } else if (obj.attachEvent) {
//
//         // IE8
//         obj["e" + type + fn] = fn;
//         obj[type + fn] = function () {
//          obj["e" + type + fn](window.event);
//         }
//         obj.attachEvent("on" + type, obj[type + fn]);
//
//       }
//     } else {
//
//       // Custom event
//       obj.eventListeners || (obj.eventListeners = {});
//       if (!obj.eventListeners.hasOwnProperty(type)) obj.eventListeners[type] = [];
//       obj.eventListeners[type].push(fn);
//     }
//   },
//
//   // Trigger the given event. At this point,
//   // we don't support arguments, but we should.
//
//   trigger: function(type) {
//     type = type.toLowerCase();
//     this.eventListeners || (this.eventListeners = {});
//     if (this.eventListeners.hasOwnProperty(type)) {
//       var listeners = this.eventListeners[type];
//       for (var i = 0; i < listeners.length; i++) {
//         listeners[i].call();
//       }
//     }
//   }
// };
//
// // Default properties and constructor for models
//
// MediumEditor.Model = function(attrs) {
//   attrs || (attrs = {});
//   this.initialise.apply(this, arguments);
// };
// _extend(MediumEditor.Model.prototype, MediumEditor.Events, {
//   initialise: function(attrs) {}
// });
//
// // Default properties and constructor for
// // collections
//
// MediumEditor.Collection = function(attrs) {
//   attrs || (attrs = {});
//   this.initialise.apply(this, arguments);
// };
// _extend(MediumEditor.Collection.prototype, MediumEditor.Events, {
//   items: null,
//   initialise: function(attrs) {
//     this.items = [];
//   },
//   at: function(ix) {
//     return this.items[ix];
//   },
//   add: function(item) {
//     this.items.push(item);
//   },
//   size: function() {
//     return this.items.length;
//   },
//   html: function() {
//     var toReturn = '';
//     for (var i = 0; i < this.size(); i++) {
//       toReturn += this.at(i).html();
//     }
//     return toReturn;
//   }
// });
//
// // Default properties and constructor for views
//
// MediumEditor.View = function(attrs) {
//   attrs || (attrs = {});
//   if (attrs.hasOwnProperty('model')) this.model = attrs['model'];
//   this.initialise.apply(this, arguments);
// };
// _extend(MediumEditor.View.prototype, MediumEditor.Events, {
//   el: null,
//   model: null,
//   initialise: function(attrs) {},
//
//   // Override on to assume the default subject
//   // object is the element, not the model
//   on: function(type, obj, fn) {
//     if (typeof obj === 'function') { fn = obj; obj = this.el; }
//     MediumEditor.Events.on(type, obj, fn);
//   }
// });
//
// // Adapted from Backbone. Establishes the prototype
// // chain for subclasses.
// var subclass = function(protoProps) {
//   var parent = this;
//   var child = function(){ return parent.apply(this, arguments); };
//
//   // Set the prototype chain to inherit from
//   // `parent`, without calling `parent`'s
//   // constructor function.
//   var Surrogate = function(){ this.constructor = child; };
//   Surrogate.prototype = parent.prototype;
//   child.prototype = new Surrogate;
//
//   // Add prototype properties (instance properties)
//   // to the subclass, if supplied.
//   if (protoProps) _extend(child.prototype, protoProps);
//
//   // Set a convenience property in case the parent's
//   // prototype is needed later.
//   child.__super__ = parent.prototype;
//
//   return child;
// };
//
// // Set up inheritance for the model, collection and
// // view
// MediumEditor.Model.extend = MediumEditor.Collection.extend = MediumEditor.View.extend = subclass;
//
// // ---------------------------------------------
// //  Collections
// // ---------------------------------------------
//
// MediumEditor.BlockCollection = MediumEditor.Collection.extend({
// });
//
// MediumEditor.NodeCollection = MediumEditor.Collection.extend({
// });
//
// // ---------------------------------------------
// //  Taxonomy
// // ---------------------------------------------
//
// // Define the permitted taxonomy. This describes
// // the configuration of blocks and nodes we permit.
// //
// // We could define this using rules in each of the
// // subclasses, but this gives a much better
// // overview of what's allowed and should make it
// // easier to make and test changes or add new
// // blocks/nodes later.
// //
// // Begin with the taxonomy of text nodes (used in
// // paragraphs, quotes and list items). Basically,
// // a node can contain any other node, except
// // TextNode (which is a leaf) and a node can't be
// // a descendent of a node of the same type e.g. a
// // StrongNode can't be the descendent of another
// // StrongNode.
//
// MediumEditor.TEXT_TAXONOMY = {
//   'TextNode': true,
//   'LineBreakNode': true,
//   'StrongNode': {
//     'TextNode': true,
//     'EmphasisNode': {
//       'TextNode': true,
//       'AnchorNode': {
//         'TextNode': true
//       }
//     },
//     'AnchorNode': {
//       'TextNode': true,
//       'EmphasisNode': {
//         'TextNode': true
//       }
//     }
//   },
//   'EmphasisNode': {
//     'TextNode': true,
//     'StrongNode': {
//       'TextNode': true,
//       'AnchorNode': {
//         'TextNode': true
//       }
//     },
//     'AnchorNode': {
//       'TextNode': true,
//       'StrongNode': {
//         'TextNode': true
//       }
//     }
//   },
//   'AnchorNode': {
//     'TextNode': true,
//     'StrongNode': {
//       'TextNode': true,
//       'EmphasisNode': {
//         'TextNode': true
//       }
//     },
//     'EmphasisNode': {
//       'TextNode': true,
//       'StrongNode': {
//         'TextNode': true
//       }
//     }
//   }
// };
//
// // Now the actual taxonomy. All the blocks are
// // defined here.
//
// MediumEditor.PERMITTED_TAXONOMY = {
//   'ParagraphBlock':   MediumEditor.TEXT_TAXONOMY,
//   'QuoteBlock':       MediumEditor.TEXT_TAXONOMY,
//   'HeadingBlock': {
//     'TextNode':       true,
//     'LineBreakNode':  true,
//     'AnchorNode': {
//       'TextNode':     true
//     }
//   },
//   'UnorderedListBlock': {
//     'ListItemNode':   MediumEditor.TEXT_TAXONOMY
//   },
//   'OrderedListBlock': {
//     'ListItemNode':   MediumEditor.TEXT_TAXONOMY
//   },
//   'DividerBlock':     {},           // Leaf blocks
//   'ImageBlock':       {},
//   'VideoBlock':       {}
// };
//
// // ---------------------------------------------
// //  Node Models
// // ---------------------------------------------
//
// // Now model out the nodes themselves. Begin
// // with the abstract class and the leaf nodes
// // (text and line break).
//
// MediumEditor.NodeModel = MediumEditor.Model.extend({
//   type:      '',
//   parent:    null,
// });
// MediumEditor.NodeModel.extend = subclass;
// MediumEditor.TextNodeModel = MediumEditor.NodeModel.extend({
//   type:    'TextNode',
//   content: '',
//   html: function() {
//     return this.content;
//   },
//   insert: function(str,at) {
//     this.content = [this.content.slice(0, at), str, this.content.slice(at)].join('');
//     this.trigger('changed');
//   }
// });
// MediumEditor.LineBreakNodeModel = MediumEditor.NodeModel.extend({
//   type:    'LineBreakNode',
//   html: function() {
//     return '<br>';
//   }
// });
//
// // Model elements, which are nodes that have
// // children.
//
// MediumEditor.ElementModel = MediumEditor.NodeModel.extend({
//   children:  new MediumEditor.NodeCollection(),
//   add: function(node) {
//     this.children.add(node);
//     node.parent = this;
//
//     // If any child node changes, trigger changed
//     // on this as well
//     this.on('changed', node, function() { this.trigger('changed') }.bind(this));
//   }
// });
// MediumEditor.ElementModel.extend = subclass;
// MediumEditor.StrongNodeModel = MediumEditor.ElementModel.extend({
//   type: 'StrongNode',
//   html: function() {
//     return '<strong>' + this.children.html() + '</strong>';
//   }
// });
// MediumEditor.EmphasisNodeModel = MediumEditor.ElementModel.extend({
//   type: 'EmphasisNode',
//   html: function() {
//     return '<em>' + this.children.html() + '</em>';
//   }
// });
// MediumEditor.AnchorNodeModel = MediumEditor.ElementModel.extend({
//   type: 'AnchorNode',
//   href: '',
//   html: function() {
//     return '<a href="' + this.href + '">' + this.children.html() + '</a>';
//   }
// });
// MediumEditor.ListItemNodeModel = MediumEditor.ElementModel.extend({
//   type: 'ListItemNode',
//   href: '',
//   html: function() {
//     return '<li>' + this.children.html() + '</li>';
//   }
// });
//
// // ---------------------------------------------
// //  Block Models
// // ---------------------------------------------
//
// MediumEditor.BlockModel = MediumEditor.Model.extend({
//   type:      ''
// });
// MediumEditor.BlockModel.extend = subclass;
// MediumEditor.ParagraphBlockModel = MediumEditor.BlockModel.extend({
//   type:      'ParagraphBlock',
//   children:  new MediumEditor.NodeCollection(),
//   add: function(node) {
//     this.children.add(node);
//     node.parent = this;
//
//     // If any child nodes changed, trigger
//     // changed on this as well
//     this.on('changed', node, function() {
//       this.trigger('changed')
//     }.bind(this));
//   },
//   html: function() {
//     return '<p>' + this.children.html() + '</p>';
//   }
// });
// MediumEditor.HeadingBlockModel = MediumEditor.BlockModel.extend({
//   type:   'HeadingBlock',
//   children:  new MediumEditor.NodeCollection(),
//   html: function() {
//     return '<h3>' + this.children.html() + '</h3>';
//   }
// });
// MediumEditor.QuoteBlockModel = MediumEditor.BlockModel.extend({
//   type: 'QuoteBlock',
//   children:  new MediumEditor.NodeCollection(),
//   html: function() {
//     return '<blockquote>' + this.children.html() + '</blockquote>';
//   }
// });
// MediumEditor.UnorderedListBlockModel = MediumEditor.BlockModel.extend({
//   type: 'UnorderedListBlock',
//   children:  new MediumEditor.NodeCollection(),
//   html: function() {
//     return '<ul>' + this.children.html() + '</ul>';
//   }
// });
// MediumEditor.UnorderedListBlockModel = MediumEditor.BlockModel.extend({
//   type: 'OrderedListBlock',
//   children:  new MediumEditor.NodeCollection(),
//   html: function() {
//     return '<ol>' + this.children.html() + '</ol>';
//   }
// });
// MediumEditor.DividerModel = MediumEditor.BlockModel.extend({
//   type: 'DividerBlock',
//   html: function() {
//     return '<hr>';
//   }
// });
// MediumEditor.ImageModel = MediumEditor.BlockModel.extend({
//   type: 'ImageBlock',
//   src: '',
//   html: function() {
//     return '<figure><img src="' + this.src + '"></figure>';
//   }
// });
// MediumEditor.VideoModel = MediumEditor.BlockModel.extend({
//   type: 'VideoBlock',
//   html: function() {
//     return '<figure>TODO</figure>';
//   }
// });
//
// // ---------------------------------------------
// //  Document Model
// // ---------------------------------------------
//
// MediumEditor.DocumentModel = MediumEditor.Model.extend({
//
//   // Constructor. Parse the intial HTML and create
//   // a blocks collection.
//   initialise: function(attrs) {
//     var html = attrs['html'] || '';
//     this.children = this._parse(html);
//   },
//
//   // Given a HTML string, parses it and returns a
//   // MediumEditorBlockCollection.
//   _parse: function(html) {
//
//     // TODO - for now just return a blank paragraph
//     var toReturn = new MediumEditor.BlockCollection();
//     var p = new MediumEditor.ParagraphBlockModel();
//     var lbn = new MediumEditor.LineBreakNodeModel();
//     var tn = new MediumEditor.TextNodeModel();
//     tn.content = 'The quick brown fox jumped over the lazy dog';
//     // p.add(lbn);
//     p.add(tn);
//     toReturn.add(p);
//     p.parent = this;
//     this.on('changed', p, function() { this.trigger('changed') }.bind(this));
//     return toReturn;
//   },
//
//   html: function() {
//     var toReturn = '';
//     for (var i = 0; i < this.children.size(); i++) {
//       toReturn += this.children.at(i).html();
//     }
//     return toReturn;
//   }
//
// });
//
// // ---------------------------------------------
// //  Selection
// // ---------------------------------------------
//
// // The selection object. A selection can be
// // none, a caret, a range (spanning multiple
// // models), an image or a video.
// //
// // The selection can be created directly (by
// // passing in the start and end models and their
// // offsets), or by using the static constructor
// // helpers below.
//
// MediumEditor.Selection = function(attrs) {
//
//   // Instance members, with their default values
//   this.documentModel = null;
//   this.documentView = null;
//   this.startNode = null;
//   this.startOffset = 0;
//   this.endNode = null;
//   this.endOffset = 0;
//
//   // Automatically determine type
//   if (attrs == null) {
//     this.type = 'none';
//   } else {
//     this.documentModel = attrs['documentModel'];
//     this.documentView = attrs['documentView'];
//     this.startNode = attrs['startNode'];
//     this.startOffset = attrs['startOffset'];
//     this.endNode = attrs['endNode'];
//     this.endOffset = attrs['endOffset'];
//     this.type = this.startNode == this.endNode ? 'caret' : 'range';
//   }
// }
//
// // Create and return an empty selection
//
// MediumEditor.Selection.none = function() {
//   return new MediumEditor.Selection();
// };
//
// // Create a selection from DOM nodes and
// // offsets. Requires the document model and
// // view, the start and end DOM nodes and
// // their relevant offsets. Converts to model
// // space and returns the selection.
//
// MediumEditor.Selection.fromDOM = function(attrs) {
//   return new MediumEditor.Selection({
//     documentModel:  attrs['documentModel'],
//     documentView:   attrs['documentView'],
//     startNode:      MediumEditor.Selection._mapDOMToModel(attrs['startNode'], attrs['documentModel'], attrs['documentView']),
//     startOffset:    attrs['startOffset'],
//     endNode:        MediumEditor.Selection._mapDOMToModel(attrs['endNode'], attrs['documentModel'], attrs['documentView']),
//     endOffset:      attrs['endOffset']
//   });
// };
//
// MediumEditor.Selection._mapDOMToModel = function(domNode, documentModel, documentView) {
//
//   // Walk back up the DOM tree until we find the
//   // document, storing each node as we go
//   var nodes = [];
//   do {
//     nodes.push(domNode);
//     domNode = domNode.parentNode;
//   } while (domNode != documentView.el);
//
//   // Now walk back down the document model,
//   // using the element indexes.
//   var model = documentModel;
//   for(var i = nodes.length - 1; i >= 0; i--) {
//     var node = nodes[i];
//     var indexWithinParent = Array.prototype.indexOf.call(node.parentNode.childNodes, node);
//     model = model.children.at(indexWithinParent);
//   }
//
//   return model;
// };
//
// MediumEditor.Selection._mapModelToDOM = function(nodeModel, documentModel, documentView) {
//
//   // Walk back up the model tree until we find the
//   // root, storing each model as we go
//   var models = [];
//   do {
//     models.push(nodeModel);
//     nodeModel = nodeModel.parent;
//   } while (nodeModel != documentModel);
//
//   // Now walk back down the DOM tree, using the
//   // element indexes.
//   var domNode = documentView.el;
//   for(var i = models.length - 1; i >= 0; i--) {
//     var model = models[i];
//     var indexWithinParent = Array.prototype.indexOf.call(model.parent.children.items, model);
//     domNode = domNode.childNodes[indexWithinParent];
//   }
//
//   return domNode;
// };
//
// // Create a selection from a click event. This
// // requires a couple of helper functions to
// // support IE8.
//
// MediumEditor.Selection.fromClick = function(attrs) {
//
//   var e = attrs['event'] || window.event;
//   var target = e.target || e.srcElement;
//   if (!MediumEditor.Selection._isAncestorOf(target, attrs['documentView'].el)) return MediumEditor.Selection.none();
//
//   if (window.getSelection) {
//
//     // Normal browsers
//     var sel = window.getSelection();
//     return MediumEditor.Selection.fromDOM({
//       documentModel:  attrs['documentModel'],
//       documentView:   attrs['documentView'],
//       startNode:      sel.anchorNode,
//       startOffset:    sel.anchorOffset,
//       endNode:        sel.focusNode,
//       endOffset:      sel.focusOffset
//     });
//
//   } else {
//
//     // IE8
//     var sel = document.selection;
//     var range = sel.createRange();
//     var startInfo = MediumEditor.Selection._ieSelectionInfo(range, 'start');
//     var endInfo = MediumEditor.Selection._ieSelectionInfo(range, 'end');
//     return MediumEditor.Selection.fromDOM({
//       documentModel:  attrs['documentModel'],
//       documentView:   attrs['documentView'],
//       startNode:      startInfo.node,
//       startOffset:    startInfo.offset,
//       endNode:        endInfo.node,
//       endOffset:      endInfo.offset
//     });
//   }
// };
//
// // Does the editor contain the given node?
// MediumEditor.Selection._isAncestorOf = function(descendent, ancestor) {
//   if (ancestor == descendent) {
//     return true;
//   } else if (!descendent.parentNode || descendent.parentNode.nodeType != 1) {
//     return false;
//   } else {
//     return MediumEditor.Selection._isAncestorOf(descendent.parentNode, ancestor);
//   }
// };
//
// // Given a range and a string value indicating
// // whether we're querying the start or end of
// // the range, return an object with properties
// // `node` and `offset` representing the DOM
// // node and offset at that end of the range.
// // This is a polyfill for IE8, adapted from
// // https://gist.github.com/Munawwar/1115251
//
// MediumEditor.Selection._ieSelectionInfo = function(range, whichEnd) {
//   if(!range) return null;
//   whichEnd = whichEnd.toLowerCase();
//   var rangeCopy = range.duplicate(),                  // Create two copies
//       rangeObj  = range.duplicate();
//   rangeCopy.collapse(whichEnd == 'start');            // Collapse the range to either the start or the end
//
//   // moveToElementText throws a fit if the user
//   // clicks an input element
//   var parentElement = rangeCopy.parentElement();
//   if (parentElement instanceof HTMLInputElement) return null;
//
//   // IE8 can't have the selection end at the zeroth
//   // index of the parentElement's first text node.
//   rangeObj.moveToElementText(parentElement);          // Select all text of parentElement
//   rangeObj.setEndPoint('EndToEnd', rangeCopy);        // Move end point to rangeCopy
//
//   // Now traverse through sibling nodes to find the
//   // exact node and the selection's offset.
//   return MediumEditor.Selection._ieFindTextNode(parentElement.firstChild, rangeObj.text);
// };
//
// // Given a node and some text, iterate through it
// // and its siblings until we find a text node
// // which matches the given text.
// MediumEditor.Selection._ieFindTextNode = function(node, text) {
//
//   // Iterate through all the child text nodes and
//   // check for matches. As we go through each text
//   // node keep removing the text value (substring)
//   // from the beginning of the text variable.
//   do {
//     if(node.nodeType == 3) {              // Text node
//       var find = node.nodeValue;
//       if (text.length > 0 && text.indexOf(find) === 0 && text !== find) { //text==find is a special case
//         text = text.substring(find.length);
//       } else {
//         return {
//           node:   node,
//           offset: text.length
//         };
//       }
//     } else if (node.nodeType === 1) {     // Element node
//       var range = document.body.createTextRange();
//       range.moveToElementText(node);
//       text = text.substring(range.text.length);
//     }
//   } while ((node = node.nextSibling));
//   return null;
// };
//
// // Instance methods on the selection object
//
// MediumEditor.Selection.prototype = {
//   next: function() {
//     // TODO
//   },
//   prev: function() {
//     // TODO
//   },
//   offset: function() {
//
//     // This really only makes sense for caret
//     if (this.type != 'caret') return;
//
//     // Get the DOM equivalents from the node models
//     var domStart = MediumEditor.Selection._mapModelToDOM(this.startNode, this.documentModel, this.documentView);
//     var domEnd = MediumEditor.Selection._mapModelToDOM(this.endNode, this.documentModel, this.documentView);
//     var documentRect = this.documentView.el.getBoundingClientRect();
//
//     if (window.getSelection) {
//
//       // Normal browsers
//       var sel = window.getSelection();
//       var range = sel.getRangeAt(0);
//       if (!range) {
//         range = document.createRange();
//         sel.addRange(range);
//       }
//       range.setStart(domStart, this.startOffset);
//       range.setEnd(domEnd, this.endOffset);
//       var rect = range.getBoundingClientRect();
//       var top = rect.top;
//       var left = rect.left;
//
//       // Occassionally, this returns [0,0,0,0] (see
//       // http://stackoverflow.com/a/8475824/889232). If
//       // so, fall back to inserting then removing a
//       // temporary element (source
//       // http://stackoverflow.com/a/6847328/889232)
//
//       if (top == 0 && left == 0) {
//         var span = document.createElement("span");
//
//         // Ensure span has dimensions and position by
//         // adding a zero-width space character
//         span.appendChild(document.createTextNode("\u200b"));
//         range.insertNode(span);
//         rect = span.getClientRects()[0];
//         top = rect.top;
//         left = rect.left;
//         var spanParent = span.parentNode;
//         spanParent.removeChild(span);
//
//         // Glue any broken text nodes back together
//         spanParent.normalize();
//       }
//
//       return { top: top - documentRect.top, left: left - documentRect.left };
//     }
//     else if (document.selection) {
//
//       // IE8
//       var sel = document.selection;
//       var range = sel.createRange();
//       range.setStart(domStart, this.startOffset);
//       range.setEnd(domEnd, this.endOffset);
//       return { top: range.offsetTop - documentRect.top, left: range.offsetLeft - documentRect.left };
//     }
//   },
// };
//
// // ---------------------------------------------
// //  Views
// // ---------------------------------------------
//
// // The selection object. A selection can be
// // none, a caret, a range (spanning multiple
// // models), an image or a video.
// //
// // The selection is always represented in model
// // space. Click and highlight events are
// // mapped from DOM space into model space via
// // the EditorView's `_mapDOMSelectionToModels`
// // method, and model selection is mapped back
// // into DOM space via the `_mapSelectionToDOM`
// // method for cursor placement etc.
// //
// // With the exception of image and video
// // selections, the nodes are always leaf nodes
// // (either text or line break).
//
// // The editor view
// MediumEditor.EditorView = MediumEditor.View.extend({
//
//   caret:                 null,                                  // The caret element
//   selection:             MediumEditor.Selection.none(),         // The selection object (defaults to none)
//
//   initialise: function(attrs) {
//
//     // Create the editor view element
//     this.el = document.createElement('div');
//     this.el.className = 'medium-editor';
//
//     // Create the caret element
//     this.caret = document.createElement('div');
//     this.caret.className = 'medium-editor-caret';
//     this.caret.style.display = 'none';
//     this.el.appendChild(this.caret);
//
//     // Register listeners. Start with the click
//     // event for selection. Note, we listen on
//     // the document instead of the element
//     // because the user may mousedown on the
//     // element but mouseup outside it (in the
//     // case of a range selection).
//     this.on('click', document, this._onClick.bind(this));
//
//     // Listen to all key events - if we have
//     // focus, we'll handle those events.
//     this.on('keypress', document, this._onKeyDown.bind(this));
//
//     // Add a document view as a child
//     this.documentView = new MediumEditor.DocumentView({ model: this.model });
//     this.el.appendChild(this.documentView.el);
//   },
//
//   _onClick: function(e) {
//     var selection = MediumEditor.Selection.fromClick({
//       documentModel:    this.model,
//       documentView:     this.documentView,
//       event:            e,
//     });
//     this._setSelection(selection);
//   },
//
//   _setSelection: function(selection) {
//     this.selection = selection;
//     this._positionCaret();
//   },
//
//   _positionCaret: function() {
//     if (this.selection.type == 'caret') {
//       var offset = this.selection.offset();
//       this.caret.style.display = 'block';
//       this.caret.style.top = offset.top + 'px';
//       this.caret.style.left = offset.left + 'px';
//     } else {
//       this.caret.style.display = 'none';
//     }
//   },
//
//   _hasFocus: function() {
//     return this.selection.type != 'none';
//   },
//
//   _onKeyDown: function(e) {
//     if (this._hasFocus()) {
//
//       switch(e.which) {
//         case 9:             // Tab
//         case 16:            // Shift
//         case 17:            // Ctrl
//         case 18:            // Alt
//         case 19:            // Pause/break
//         case 20:            // Caps lock
//         case 27:            // Escape
//         case 45:            // Insert
//         case 91:            // Left window key
//         case 92:            // Right window key
//           // No effect
//           break;
//         case 8:             // Backspace
//           // TODO
//           break;
//         case 13:            // Enter
//           // TODO
//           break;
//         case 33:            // Page up
//           // TODO
//           break;
//         case 34:            // Page down
//           // TODO
//           break;
//         case 35:            // End
//           // TODO
//           break;
//         case 26:            // Home
//           // TODO
//           break;
//         case 37:            // Left arrow
//           // TODO
//           break;
//         case 38:            // Up arrow
//           // TODO
//           break;
//         case 39:            // Right arrow
//           // TODO
//           break;
//         case 40:            // Down arrow
//           // TODO
//           break;
//         case 46:            // Delete
//           // TODO
//           break;
//         default:            // Any other key
//           if (this.selection.type == 'caret') {
//             //var char = String.fromCharCode(e.which);
//             //var char = e.keyIdentifier;
//             var char = String.fromCharCode(parseInt(e.keyIdentifier.substring(2),16))
//             if (!e.shiftKey) char = char.toLowerCase();       // The key code is always the uppercase equivalent
//             var model = this.selection.startNode;
//             model.insert(char, this.selection.startOffset);
//             this.selection.startOffset++;
//             this.selection.endOffset++;
//             this._positionCaret();
//           }
//       }
//     }
//   }
//
// });
//
// // The document view
// MediumEditor.DocumentView = MediumEditor.View.extend({
//
//   initialise: function(attrs) {
//
//     // Create the document view element
//     this.el = document.createElement('div');
//     this.el.className = 'medium-editor-document';
//
//     // Set the HTML - note we could use sub-views
//     // here for the blocks, but we want the HTML
//     // produced by the document model and HTML
//     // displayed in the editor to be identical.
//     this.el.innerHTML = this.model.html();
//
//     // Re-render if the document model is changed.
//     this.on('changed', this.model, this._onModelChanged.bind(this));
//   },
//
//   // Whenever the model is changed, re-render
//   _onModelChanged: function() {
//     this._render();
//   },
//
//   // Very simple render method - just set the
//   // HTML of the element to the HTML generated by
//   // the model. That way we keep the model data
//   // and its representation as close together as
//   // possible.
//   _render: function() {
//     this.el.innerHTML = this.model.html()
//   }
//
// });
