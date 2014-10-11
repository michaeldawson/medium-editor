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
    if (!this._supportedPlatform()) return false;

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
  // supported. We need querySelector and
  // contentEditable support.
  _supportedPlatform: function() {
    return this._querySelectorSupported() && this._contentEditableSupported();
  },

  // Detects support for querySelector.
  // Source: https://github.com/Modernizr/Modernizr/blob/master/feature-detects/queryselector.js
  _querySelectorSupported: function() {
    return 'querySelector' in document && 'querySelectorAll' in document;
  },

  // Detects support for the `contenteditable`
  // attribute.
  // Source: https://github.com/Modernizr/Modernizr/blob/master/feature-detects/contenteditable.js
  _contentEditableSupported: function() {

    // early bail out
    if (!('contentEditable' in document.body)) return false;

    // some mobile browsers (android < 3.0, iOS < 5) claim to support
    // contentEditable, but but don't really. This test checks to see
    // confirms wether or not it actually supports it.

    var div = document.createElement('div');
    div.contentEditable = true;
    return div.contentEditable === 'true';
  },
});

// ---------------------------------------------
//  Selection
// ---------------------------------------------

MediumEditor.Selection = Class.extend({
  init: function(attrs) {
    this.documentView = attrs['documentView'];
  },

  // Helper function. We express our caret and
  // range selection points in document space
  // (i.e. the index is the paragraph in the
  // document and the offset is the character
  // offset within it). However, to apply a
  // selection, we need to be able to translate
  // to node space (the internal nodes of an
  // element and the offset relative to the
  // start of that node).
  _translateToNodeSpace: function(ix, offset) {
    var el = this.documentView.el.childNodes[ix];
    var textNodes = this._getTextNodesIn(el);
    for(var i = 0; i < textNodes.length; i++) {
      var node = textNodes[i];
      if (offset <= node.length) {
        return { node: node, offset: offset };
      } else {
        offset -= node.length;
      }
    }
  },

  // Source: http://stackoverflow.com/a/6242538/889232
  _getTextNodesIn: function(node) {
    var textNodes = [];
    if (node.nodeType == 3) {
      textNodes.push(node);
    } else {
      var children = node.childNodes;
      for(var i = 0; i < children.length; i++) {
        textNodes.push.apply(textNodes, this._getTextNodesIn(children[i]));
      }
    }
    return textNodes;
  }
});

MediumEditor.NullSelection = MediumEditor.Selection.extend({
  init: function(attrs) {
    this._super(attrs);
  },
  apply: function() {
    if (window.getSelection) {
      window.getSelection().removeAllRanges()
    } else if (document.selection) {
      document.selection.empty();
    }
  }
});

MediumEditor.CaretSelection = MediumEditor.Selection.extend({
  init: function(attrs) {
    this._super(attrs);
    this.blockIx = attrs['blockIx'];
    this.offset = attrs['offset'];
  },
  apply: function() {
    if (document.createRange && window.getSelection) {

      // Normal browsers
      var range = document.createRange();
      var sel = window.getSelection();
      var mapping = this._translateToNodeSpace(this.blockIx, this.offset);
      range.setStart(mapping.node, mapping.offset);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);

    } else if (document.selection && document.body.createTextRange) {

      // IE
      var textRange = document.body.createTextRange();
      textRange.moveToElementText(this.documentView.el.childNodes[this.blockIx]);
      textRange.collapse(true);
      textRange.moveEnd("character", this.offset);
      textRange.moveStart("character", this.offset);
      textRange.select();
    }
  }
});

MediumEditor.RangeSelection = MediumEditor.Selection.extend({
  init: function(attrs) {
    this._super(attrs);
    this.rectangle = attrs['rectangle'];
    this.startBlockIx = attrs['startBlockIx'];
    this.startOffset = attrs['startOffset'];
    this.endBlockIx = attrs['endBlockIx'];
    this.endOffset = attrs['endOffset'];
    if (this.startBlockIx == this.endBlockIx && this.startOffset > this.endOffset) {
      var temp = this.endOffset;
      this.endOffset = this.startOffset;
      this.startOffset = temp;
    }
  },
  apply: function() {
    if (document.createRange && window.getSelection) {

      // Normal browsers
      var range = document.createRange();
      var sel = window.getSelection();
      var startMapping = this._translateToNodeSpace(this.startBlockIx, this.startOffset);
      var endMapping = this._translateToNodeSpace(this.endBlockIx, this.endOffset);
      range.setStart(startMapping.node, startMapping.offset);
      range.setEnd(endMapping.node, endMapping.offset);
      sel.removeAllRanges();
      sel.addRange(range);

    } else if (document.selection && document.body.createTextRange) {

      // IE
      var textRange = document.body.createTextRange();
      textRange.moveToElementText(this.documentView.el.childNodes[this.blockIx]);
      textRange.collapse(true);
      textRange.moveEnd("character", this.offset);
      textRange.moveStart("character", this.offset);
      textRange.select();
    }
  }
});

MediumEditor.ImageSelection = MediumEditor.Selection.extend({
  init: function(attrs) {
    this._super(attrs);
  }
});

MediumEditor.VideoSelection = MediumEditor.Selection.extend({
  init: function(attrs) {
    this._super(attrs);
  }
});

// Create and return the correct selection type
// based upon the current selection as described
// by the browser.

MediumEditor.Selection.create = function(attrs) {

  // Determine the start and end indices and
  // offsets. Note, we need these in document
  // space (with the indices corresponding to
  // block indices within the document and
  // offsets corresponding to character
  // indices), so they'll need to be
  // translated from node space first.
  var startIx, startOffset, endIx, endOffset, rectangle;

  if (window.getSelection) {

    // Normal browsers
    var sel = window.getSelection();
    var range = sel.getRangeAt(0);

    var startElement = MediumEditor.Selection._elementFromNode(range.startContainer, attrs['documentView'].el);
    var endElement = MediumEditor.Selection._elementFromNode(range.endContainer, attrs['documentView'].el);
    var startIx = Array.prototype.indexOf.call(startElement.parentNode.childNodes, startElement);
    var endIx = Array.prototype.indexOf.call(endElement.parentNode.childNodes, endElement);

    var startRange = range.cloneRange();
    startRange.selectNodeContents(startElement);
    startRange.setEnd(range.startContainer, range.startOffset);
    startOffset = startRange.toString().length;

    var endRange = range.cloneRange();
    endRange.selectNodeContents(endElement);
    endRange.setEnd(range.endContainer, range.endOffset);
    var endOffset = startRange.toString().length;

    rectangle = range.getBoundingClientRect();

  } else if (document.selection) {

    // IE8
    var sel = document.selection;
    var range = sel.createRange();
    var startInfo = MediumEditor.Selection._ieSelectionInfo(range, 'start');
    var endInfo = MediumEditor.Selection._ieSelectionInfo(range, 'end');



    startOffset = startInfo.offset;
    endOffset = endInfo.offset;
    startNode = startInfo.node;
    endNode = endInfo.node;
    rectangle = sel.getBoundingClientRect();

  }

  if (!MediumEditor.Selection._isAncestorOf(startNode, attrs['documentView'].el)) {

    // Selection is outside the document
    return new MediumEditor.NullSelection({});

  } else if (startIx == endIx && startOffset == endOffset) {

    // Caret selection
    return new MediumEditor.CaretSelection({
      documentView:   attrs['documentView'],
      blockIx:        startIx,
      offset:         startOffset
    });

  } else {

    // Range selection
    return new MediumEditor.RangeSelection({
      documentView:   attrs['documentView'],
      rectangle:      rectangle,
      startBlockIx:   startIx,
      startOffset:    startOffset,
      endBlockIx:     endIx,
      endOffset:      endOffset
    });
  }
}

// Selection helper functions

// Given a node, find it's element within the
// the medium editor document.
MediumEditor.Selection._elementFromNode = function(node, documentEl) {
  while (node.parentNode != documentEl) {
    node = node.parentNode;
  }
  return node;
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

// Helper method - is one element the ancestor
// of another? Used to check if the start node
// in a selection is within the editor.
MediumEditor.Selection._isAncestorOf = function(descendent, ancestor) {
  if (ancestor == descendent) {
    return true;
  } else if (!descendent.parentNode || descendent.parentNode.nodeType != 1) {
    return false;
  } else {
    return MediumEditor.Selection._isAncestorOf(descendent.parentNode, ancestor);
  }
};

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
    this.insertAt(item, this.size());
  },
  insertAt: function(item, ix) {
    this.items.splice(ix, 0, item);
    this.trigger('add', item, ix);
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
    var item = this.at(ix);
    this.items.splice(ix, 1);
    this.trigger('remove', item, ix);
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
    var p = new MediumEditor.ParagraphModel({ text: 'The quick brown fox jumped over the lazy dog.' });
    this.children.add(p);
    p = new MediumEditor.ParagraphModel({ text: 'Lazy wizards brew something something queen.' });
    this.children.add(p);
  },
  html: function() {
    return this.children.html();
  },
  _parse: function(html) {
    // TODO
  },
  markup: function(selection, markupKlass) {
    if (!(selection instanceof MediumEditor.RangeSelection)) return;
    for(var i = selection.startBlockIx; i <= selection.endBlockIx; i++) {
      var block = this.children.at(i);
      var start = i == selection.startBlockIx ? selection.startOffset : 0;
      var end = i == selection.endBlockIx ? selection.endOffset : block.text.length;
      block.markups.add(new markupKlass({ start: start, end: end }));
    }
  },
  insertParagraph: function(selection) {

    if (selection instanceof MediumEditor.CaretSelection) {

      // Caret selections are simple - insert a new
      // paragraph after the current block and fill
      // it with whatever text occurs after the
      // offset in the current paragraph

      var block = this.children.at(selection.blockIx);
      var remainingText = block.text.substring(selection.offset);
      if (selection.offset < block.text.length) {
        block.text = block.text.substring(0, selection.offset);
        block.trigger('changed');
      }

      var newParagraph = new MediumEditor.ParagraphModel({ text: remainingText });
      this.children.insertAt(newParagraph, selection.blockIx + 1);




      // range, confined to a single block - insert a new p afterward and give it
      // all text after the end offset + remove the highlighted text from the
      // start block
      //   same for a li

      // range, spanning multiple blocks - kill everything after the offset in
      // the start block, all blocks in between and everything before the offset
      // in the end block, then insert an empty paragraph between them
      //   same for a li

      // caret - insert a new paragraph and fill it with whatever
      // text occurs in the current paragraph after the offset


    }

    // what if it begins on a heading and ends on something else, like an image or a li?


    // TODO - if selection is a normal caret, create a new paragraph and
    // fill it with whatever text occurs after the caret offset in the
    // current paragraph, then give it focus
    // if it's a list, add the next item (but don't inherit any of the
    // markups of the current cursor position)
    // it it's an image, create a new p under it
    // if it's a range, kill that range and create a new p

    // enter on an empty list item
    //   in the middle of a list?
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
    this.text = (attrs || {})['text'] || '';
    this.markups = new MediumEditor.MarkupCollection();
    this.on('add', this.markups, this._onMarkupAdded.bind(this));
  },
  innerHTML: function() {
    return this.markups.apply(this.text) || '<br>';
  },
  html: function() {
    return '<' + this.tag + '>' + this.innerHTML() + '</' + this.tag + '>';
  },
  _onMarkupAdded: function() {
    this.trigger('changed');
  }
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
    this.tag = 'ul';
    this.text = '';
  },
});

MediumEditor.OrderedListModel = MediumEditor.BlockModel.extend({
  init: function(attrs) {
    this._super(attrs);
    this.tag = 'ol';
    this.text = '';
  },
});

MediumEditor.ImageModel = MediumEditor.BlockModel.extend({
  init: function(attrs) {
    this._super(attrs);
    this.tag = 'img';
  },
});

MediumEditor.VideoModel = MediumEditor.BlockModel.extend({
  init: function(attrs) {
    this._super(attrs);
    this.tag = 'video';
  },
});

MediumEditor.DividerModel = MediumEditor.BlockModel.extend({
  init: function(attrs) {
    this._super(attrs);
    this.tag = 'hr';
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
      var temp = this.end;
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
    this.on('add', this._onItemAdded.bind(this));
  },
  _onItemAdded: function(item) {
    item.parent = this.model;
  },
  html: function() {
    var toReturn = '';
    for(var i = 0; i < this.size(); i++) {
      toReturn += this.at(i).html();
    }
    return toReturn;
  }
});

MediumEditor.MarkupCollection = MediumEditor.Collection.extend({

  init: function(attrs) {
    this._super(attrs);
    this.on('add', this._onItemAdded.bind(this));
  },

  // Normalise the collection after new markup is
  // added
  _onItemAdded: function(markup) {
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

// The editor view. Contains the actual editable
// document, along with the toolbar and any other
// related elements.

MediumEditor.EditorView = MediumEditor.View.extend({
  init: function(attrs) {
    this._super(attrs);

    // Create the editor view element
    this.el = document.createElement('div');
    this.el.className = 'medium-editor';

    // Add a document view as a child
    this.documentView = new MediumEditor.DocumentView({ model: this.model });
    this.el.appendChild(this.documentView.el);

    // Create the toolbar
    this.toolbarView = new MediumEditor.ToolbarView({ model: this.model, editorView: this });
    this.el.appendChild(this.toolbarView.el);
  }
});

// The document view
MediumEditor.DocumentView = MediumEditor.View.extend({
  init: function(attrs) {
    this._super(attrs);

    // Create the document view element
    this.el = document.createElement('div');
    this.el.className = 'medium-editor-document';
    this.el.contentEditable = true;

    // Listen for events we might want to capture
    // and cancel, like enter, backspace etc.
    this.on('keydown', this.el, this._onKeyDown.bind(this));

    // Add views for each existing block
    for(var i = 0; i < this.model.children.size(); i++) {
      var block = this.model.children.at(i);
      this._addBlock(block);
    }

    // Listen for new blocks being added
    this.model.children.on('add', this._onBlockAdded.bind(this));
  },

  _onBlockAdded: function(blockModel, ix) {
    this._addBlock(blockModel, ix);

    // Give the new block focus
    new MediumEditor.CaretSelection({ documentView: this, blockIx: ix, offset: 0 }).apply();
  },

  _addBlock: function(blockModel, ix) {
    var blockView = new MediumEditor.BlockView({ model: blockModel });
    if (ix === undefined || ix >= this.el.childNodes.length) {
      this.el.appendChild(blockView.el);
    } else {
      this.el.insertBefore(blockView.el, this.el.childNodes[ix]);
    }
  },

  // Capture and prevent any key event which adds
  // or removes a paragraph.
  _onKeyDown: function(e) {
    switch(e.which) {
      case 77:
        if (!e.ctrlKey) break;
      case 13:

        // Enter / Ctrl + m
        var s = MediumEditor.Selection.create({ documentView: this });
        this.model.insertParagraph(s);

        e.preventDefault();
        break;

      case 8:

        // Backspace
        // TODO - if we're at offset zero
        // if we're on an image, kill it - and put the cursor where?

        break;

      case 46:

        // Delete
        // TODO

        break;

      // need to also consider paste and type-over

      // for type-over, our selection may span multiple paragraphs, in which case we'd need to concatenate them together
      //   may also span 3 or more, killing the intermediate ones

      //
    }
  }
});

// Each block has a separate view
MediumEditor.BlockView = MediumEditor.View.extend({
  init: function(attrs) {
    this._super(attrs);

    // Create the block view element
    this.el = document.createElement(this.model.tag);

    // Listen for changes
    this.on('changed', this.model, this._onChanged.bind(this));

    // Do an initial render
    this._render();
  },

  _onChanged: function() {
    this._render();
  },

  _render: function() {
    this.el.innerHTML = this.model.innerHTML();
  }
});

MediumEditor.ToolbarView = MediumEditor.View.extend({

  init: function(attrs) {
    this._super(attrs);
    this.editorView = attrs['editorView'];

    // Create the toolbar view element
    this.el = document.createElement('div');
    this.el.className = 'medium-editor-toolbar';
    var arrow = document.createElement('div');
    arrow.className = 'medium-editor-toolbar-arrow';
    this.el.appendChild(arrow);

    // Add the buttons
    this.el.appendChild(new MediumEditor.ToolbarStrongButtonView({ model: this.model, editorView: this.editorView }).el);
    this.el.appendChild(new MediumEditor.ToolbarEmphasisButtonView({ model: this.model, editorView: this.editorView }).el);
    this.el.appendChild(new MediumEditor.ToolbarHeadingButtonView({ model: this.model, editorView: this.editorView }).el);
    this.el.appendChild(new MediumEditor.ToolbarQuoteButtonView({ model: this.model, editorView: this.editorView }).el);
    this.el.appendChild(new MediumEditor.ToolbarAnchorButtonView({ model: this.model, editorView: this.editorView }).el);

    // Listen to events which may modify the
    // selection, and position/show/hide the
    // toolbar accordingly. Note, we bind the
    // mouseup event to the document because
    // we need to hide the toolbar when the
    // use clicks outside the editor, plus a
    // range selection may begin in the editor
    // but end outside it.
    this.on('mouseup', document, this._onMouseUp.bind(this));
    this.on('keyup', this.editorView.el, this._onKeyUp.bind(this));
  },
  _onMouseUp: function(e) {
    this._position();
  },
  _onKeyUp: function(e) {
    this._position();
  },
  _position: function() {
    var sel = MediumEditor.Selection.create({ documentView: this.editorView.documentView });
    if (sel instanceof MediumEditor.RangeSelection) {
      var rect = sel.rectangle;

      // Convert to editor space
      var editorRect = this.editorView.el.getBoundingClientRect();
      var top = rect.top - editorRect.top; var bottom = rect.bottom - editorRect.top;
      var left = rect.left - editorRect.left; var right = rect.right - editorRect.left;

      // Measure the toolbar itself by creating an
      // invisible clone
      var clone = this.el.cloneNode(true);
      clone.style.visibility = 'hidden';
      this.el.parentNode.appendChild(clone);
      clone.className = 'medium-editor-toolbar medium-editor-toolbar-active';
      var toolbarWidth = clone.offsetWidth;
      var toolbarHeight = clone.offsetHeight;
      clone.parentNode.removeChild(clone);

      // Calculate x and y
      var x = (right + left - toolbarWidth) / 2.0;
      var y = top - toolbarHeight + document.body.scrollTop;

      // Clamp to the editor
      x = Math.min(Math.max(x, 0), editorRect.width - toolbarWidth);
      y = Math.min(y, editorRect.height - toolbarHeight);

      // Set position and make visible
      this.el.style.left = x + 'px';
      this.el.style.top = y + 'px';
      this.el.className = 'medium-editor-toolbar medium-editor-toolbar-active';
    } else {
      this.el.className = 'medium-editor-toolbar';
    }
  }
});

MediumEditor.ToolbarButtonView = MediumEditor.View.extend({
  init: function(attrs) {
    this._super(attrs);
    this.editorView = attrs['editorView'];

    // Create the button element
    this.el = document.createElement('button');
    this.el.type = 'button';

    // Listen to clicks
    this.on('click', this.el, this._onClick.bind(this));
  }
});

MediumEditor.ToolbarStrongButtonView = MediumEditor.ToolbarButtonView.extend({
  init: function(attrs) {
    this._super(attrs);
    this.el.innerHTML = '<i class="glyphicon glyphicon-bold"/>';
  },
  _onClick: function(e) {
    var sel = MediumEditor.Selection.create({ documentView: this.editorView.documentView });
    this.model.markup(sel, MediumEditor.StrongModel);
    sel.apply();      // Restore the selection - markup will have killed it because the block re-renders
  }
});

MediumEditor.ToolbarEmphasisButtonView = MediumEditor.ToolbarButtonView.extend({
  init: function(attrs) {
    this._super(attrs);
    this.el.innerHTML = '<i class="glyphicon glyphicon-italic"/>';
  },
  _onClick: function(e) {

  }
});

MediumEditor.ToolbarHeadingButtonView = MediumEditor.ToolbarButtonView.extend({
  init: function(attrs) {
    this._super(attrs);
    this.el.innerHTML = '<i class="glyphicon glyphicon-header"/>';
  },
  _onClick: function(e) {

  }
});

MediumEditor.ToolbarQuoteButtonView = MediumEditor.ToolbarButtonView.extend({
  init: function(attrs) {
    this._super(attrs);
    this.el.innerHTML = '<i class="fa fa-quote-right"/>';
  },
  _onClick: function(e) {

  }
});

MediumEditor.ToolbarAnchorButtonView = MediumEditor.ToolbarButtonView.extend({
  init: function(attrs) {
    this._super(attrs);
    this.el.innerHTML = '<i class="glyphicon glyphicon-link"/>';
  },
  _onClick: function(e) {

  }
});
