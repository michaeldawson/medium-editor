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

MediumEditor = Class.extend({});

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

// ------------------------------------------------
//  Model-DOM Mapper
// ------------------------------------------------
//  Responsible for mapping from model space to
//  DOM space (HTML) and vice-versa.
// ------------------------------------------------

MediumEditor.ModelDOMMapper = {

  // ----------------------------------------------
  //  Instance Methods
  // ----------------------------------------------

  parseHTMLIntoBlockCollection: function(attrs) {
    var toReturn = new MediumEditor.BlockCollection({ model: attrs.document });
    var el = document.createElement('div');
    el.innerHTML = attrs.html.trim();
    for(var i = 0; i < el.children.length; i++) {
      var child = el.children[i];
      var layout = child.className.substring(7).toUpperCase();
      for(var j = 0; j < child.children.length; j++) {
        var grandchild = child.children[j];
        var tagName = grandchild.tagName.toLowerCase();
        if (tagName == 'ol' || tagName == 'ul') {
          for(var k = 0; k < grandchild.children.length; k++) {
            var greatGrandchild = grandchild.children[k];
            toReturn.add(this._parseNodeIntoBlock(greatGrandchild, layout));
          }
        } else {
          toReturn.add(this._parseNodeIntoBlock(grandchild, layout));
        }
      }
    }
    return toReturn;
  },

  _parseNodeIntoBlock: function(node, layout) {

    // Determine the type from the tag name
    layout = node.className || layout;
    var attrs = { text: node.innerText, layout: layout };
    var tagName = node.tagName.toLowerCase();
    switch(tagName) {
      case 'p':           attrs['type'] = 'PARAGRAPH'; break;
      case 'blockquote':  attrs['type'] = 'QUOTE'; break;
      case 'h2':          attrs['type'] = 'HEADING1'; break;
      case 'h3':          attrs['type'] = 'HEADING2'; break;
      case 'h4':          attrs['type'] = 'HEADING3'; break;
      case 'hr':          attrs['type'] = 'DIVIDER'; break;
      case 'figure':
        attrs['type'] = node.children[0].tagName.toLowerCase() == 'img' ? 'IMAGE' : 'VIDEO';
        attrs['metadata'] = {};
        attrs['metadata']['src'] = node.children[0].src;
        if (node.children.length > 1) attrs['metadata']['caption'] = node.children[1].innerText;
        break;
      case 'li':
        attrs['type'] = node.parentNode.tagName.toLowerCase() == 'ol' ? 'ORDERED_LIST_ITEM' : 'UNORDERED_LIST_ITEM';
        break;
    }
    return new MediumEditor.BlockModel(attrs);
  },

  // Given a model, produce the HTML representation
  // as a string. Takes block models or document.
  // By default, the HTML is for editing (e.g. it
  // has contenteditable attributes set). Pass
  // { for: 'output' } to get HTML without these
  // attributes.
  toHTML: function(model, options) {

    options = typeof options == 'undefined' ? {} : options;
    options['for'] = typeof options['for'] == 'undefined' ? 'editing' : options['for'];

    if (model instanceof MediumEditor.BlockModel) {

      // Wrap the inner HTML
      var tag;
      switch(true) {
        case model.isParagraph():             tag = 'p'; break;
        case model.isQuote():                 tag = 'blockquote'; break;
        case model.isHeading1():              tag = 'h2'; break;
        case model.isHeading2():              tag = 'h3'; break;
        case model.isHeading3():              tag = 'h4'; break;
        case model.isImage():                 tag = 'figure'; break;
        case model.isVideo():                 tag = 'figure'; break;
        case model.isOrderedListItem():       tag = 'li'; break;
        case model.isUnorderedListItem():     tag = 'li'; break;
        case model.isDivider():               tag = 'div'; break;     // Inner HTML is a hr, but we wrap it in a div so it can't be selected
      }

      var openingTag = "<" + tag + ( !model.isText() && options['for'] == 'editing' ? ' contenteditable="false"' : '' ) + ( this._layoutType(model.layout()) == 'class' ? ' class="' + model.layout().toLowerCase() + '"' : '' ) + ">";
      var closingTag = "</" + tag + ">";
      var html = openingTag + this._innerHTML(model, options) + closingTag;
      return html;

    } else if (model instanceof MediumEditor.DocumentModel) {

      // Document model.
      var blocks = model.blocks();
      var toReturn = "";
      var currentWrapper = null;
      for(var i = 0; i < blocks.size(); i++) {

        // Grab handles the previous, current and
        // next blocks
        var prevBlock = i > 0 ? blocks.at(i - 1) : null;
        var currentBlock = blocks.at(i);
        var nextBlock = i < (blocks.size() - 1) ? blocks.at(i + 1) : null;

        // If this block has a different wrapper to
        // the last, or is the first block, open
        // the new wrapper
        var layout = currentBlock.layout();
        var wrapper = this._layoutType(layout) == 'wrapper' ? layout : 'SINGLE-COLUMN';
        if (wrapper != currentWrapper) {
          toReturn += "<div class='layout-" + wrapper.toLowerCase() + "'>";
          currentWrapper = wrapper;
        }

        // If this block is a list item and the
        // last block was not, open the list
        if (currentBlock.isListItem()) {
          if (prevBlock == null || prevBlock.type() != currentBlock.type()) {
            toReturn += "<" + (currentBlock.isOrderedListItem() ? "ol" : "ul") + ">";
          }
        }

        // Add the block HTML
        toReturn += this.toHTML(blocks.at(i));

        // If this block is a list item and the
        // next block is not, close the list.
        if (currentBlock.isListItem()) {
          if (nextBlock == null || nextBlock.type() != currentBlock.type()) {
            toReturn += "</" + (currentBlock.isOrderedListItem() ? "ol" : "ul") + ">";
          }
        }

        // If this block has a different wrapper to
        // the next, close the wrapper
        if (nextBlock == null || (this._layoutType(nextBlock.layout()) == 'wrapper' && currentWrapper != nextBlock.layout())) {
          toReturn += "</div>";
        }
      }
      return toReturn;
    }

  },

  // Returns the inner HTML of a given block as a
  // string. This is separated from the `outerHTML`
  // method because when re-rendering views upon
  // content change, we only want the inner HTML.
  _innerHTML: function(model, options) {

    if (model.isText()) {

      // Paragraph, heading, quote etc. Markup the
      // text
      var innerHTML = this.markup(model) || '<br>';

      // Spaces need to be converted to nbsp if
      // they're consecutive, or appear at the
      // beginning or end of the string
      return innerHTML.replace(/\s{2}/g,' &nbsp;')     // Consecutive spaces should be compressed to a space + nbsp
                      .replace(/^ /,'&nbsp;')          // Leading spaces should be nbsp
                      .replace(/ $/,'&nbsp;')          // Trailing spaces should be nbsp

    } else if (model.isMedia()) {

      // Images or videos. The actual img or iframe
      // element will be nested within a figure.
      var innerHTML;
      if (model.isImage()) {
        innerHTML = "<img src='" + model.metadata()['src'] + "'>";
      } else {
        innerHTML = "<iframe frameborder='0' allowfullscreen src='" + model.metadata()['src'] + "'>";
      }

      // Add the caption (if it exists)
      if (model.metadata()['caption']) {
        innerHTML += "<figcaption " + (options['for'] == 'editing' ? "contenteditable='true'" : "") + ">" + model.metadata()['caption'] + "</figcaption>";
      }

      return innerHTML;

    } else {

      // Divider
      return "<hr>";
    }
  },

  // Given a block model, apply all of its markups
  // and return the resulting HTML string.
  //
  // Note, we need to ensure precedence here. For
  // example, if a strong an an emphasis both start
  // at the same offset, we should return
  // '<strong><em> ...' rather than
  // '<em><strong> ...'.
  //
  // We also need to consider that markups of
  // different types in the collection can overlap
  // each other, but the produced HTML needs to
  // respect nesting rules.e.g.:
  //
  //   <strong>hi<em></strong>there</em>   <-- invalid
  markup: function(model) {

    // If there are no markups to apply, just
    // return the plain text
    var text = model.text();
    var markups = model.markups();
    if (markups.size() == 0) return text;

    // For each item in the markup array, create an
    // 'inject' - an object representing an
    // instance where we need to inject some HTML
    // into the string. Each markup has two
    // injects - one for the opening and one for
    // the closing.
    var injects = [];
    for (var i = 0; i < markups.size(); i++) {
      var markup = markups.at(i);
      injects.push({ type: 'open', at: markup.start(), tag: this._tag(markup), obj: markup });
      injects.push({ type: 'close', at: markup.end(), tag: this._tag(markup), obj: markup });
    }

    // Sort the injects by the index they occur at,
    // then by the type, then finally by the tag
    // string
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
          return this._charComparison(a.tag[0], b.tag[0]) * order;
        }
      }
    }.bind(this));

    var toReturn = '';
    var textIx = 0;

    // Go through the injects, keeping track of all
    // the open tags
    var openTags = [];
    for (var i = 0; i < injects.length; i++) {
      var inject = injects[i];

      // Add the text up to this point and update
      // the text index
      toReturn += text.substring(textIx, inject.at);
      textIx = inject.at;

      if (inject.type == 'open') {

        // Tag opening
        toReturn += this._openingTag(inject.obj);
        openTags.push(inject);

      } else {

        // Tag closing. Grab all the open tags
        // which end after this one.
        var temp = [];
        var c;
        while((c = openTags.pop()) && c.tag != inject.tag) {
          temp.push(c);
        }

        // Close the other tags first
        for (var j = 0; j < temp.length; j++) {
          toReturn += this._closingTag(temp[j].obj);
        }

        // Now close this tag
        toReturn += this._closingTag(inject.obj);

        // Now put the other tags back and re-open
        // them
        while(temp.length) {
          var tag = temp.pop();
          toReturn += this._openingTag(tag.obj);
          openTags.push(tag);
        }
      }
    }

    // Grab any remaining characters
    toReturn += text.substring(textIx);
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
  },

  // Layouts are either a wrapper of a class
  _layoutType: function(layout) {
    return layout == 'SINGLE-COLUMN' || layout == 'FULL-WIDTH' ? 'wrapper' : 'class';
  },

  _openingTag: function(model) {
    return "<" + this._tag(model) + " " + this._openingTagAttributes(model) + ">";
  },

  _closingTag: function(model) {
    return "</" + this._tag(model) + ">";
  },

  _tag: function(model) {
    switch(true) {
      case model.isStrong(): return 'strong';
      case model.isEmphasis(): return 'em';
      case model.isAnchor(): return 'a';
    }
  },

  _openingTagAttributes: function(model) {
    switch(true) {
      case model.isAnchor(): return 'href="' + model.href + '"';
    }
    return '';
  },

  // Given an index and offsets in model space,
  // return the equivalent node and offset in DOM
  // space
  modelSpaceToDOMSpace: function(documentEl, ix, offset) {
    var el = this.getBlockElementFromIndex(documentEl, ix);
    var textNodes = this._getTextNodesIn(el);
    for(var i = 0; i < textNodes.length; i++) {
      var node = textNodes[i];
      if (offset <= node.length) {
        return { node: node, offset: offset };
      } else {
        offset -= node.length;
      }
    }
    return { node: el.childNodes[0], offset: Math.min((el.childNodes[0].nodeValue || el.childNodes[0].innerText).length, offset) };
  },

  // Given an index in model space, return the
  // corresponding block DOM element, considering
  // layout and other containers
  getBlockElementFromIndex: function(documentEl, ix) {
    for (var i = 0; i < documentEl.children.length; i++) {
      var layoutContainer = documentEl.childNodes[i];
      for (var j = 0; j < layoutContainer.children.length; j++) {
        var block = layoutContainer.children[j];
        if (block.tagName.toLowerCase() == 'ol' || block.tagName.toLowerCase() == 'ul') {
          if (ix < block.childNodes.length) {
            return block.childNodes[ix];
          } else {
            ix -= block.childNodes.length;
          }
        } else {
          ix--;
        }
        if (ix < 0) return block;
      }
    }
    return null;
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
  },

  // Given a node and an offset within that node,
  // return an object containing the block index
  // and the text offset in model space.
  domSpaceToModelSpace: function(node, offset, range, start) {
    var element = this._blockElementFromNode(node);
    var ix = this.getIndexFromBlockElement(element);
    var offset = this._measureTextOffset(offset, node, element, range, start);
    return {
      ix:       ix,
      offset:   offset
    }
  },

  // Given a node, returns the block element it
  // belongs to. This assumes the node exists
  // within a block in the editor.
  _blockElementFromNode: function(node) {
    while (node.parentNode.tagName.toLowerCase() != 'div' &&  // Bit hacky - layout containers are the only divs (well dividers use them too, but they can't be selected)
           node.parentNode.tagName.toLowerCase() != 'ol' &&
           node.parentNode.tagName.toLowerCase() != 'ul') {
      node = node.parentNode;
      if (node.parentNode == document.body) return null;
    }
    return node;
  },

  // Given a block element, determine what the
  // index is within model space, considering
  // layout and other containers
  getIndexFromBlockElement: function(el) {

    // Find the document element
    var documentEl = el;
    if (el.tagName.toLowerCase() == 'li') documentEl = documentEl.parentNode;
    documentEl = documentEl.parentNode.parentNode;

    var ix = 0;

    // Iterate every layout container
    for(var i = 0; i < documentEl.children.length; i++) {
      var layoutContainer = documentEl.children[i];

      // Iterate every block within the container
      for(var j = 0; j < layoutContainer.children.length; j++) {
        var block = layoutContainer.children[j];

        // If this is a list parent block, iterate
        // the items underneath
        if (block.tagName.toLowerCase() == 'ul' || block.tagName.toLowerCase() == 'ol') {
          for(var k = 0; k < block.children.length; k++) {
            var li = block.children[k];
            if (li == el) return ix;    // If this is our block, return the index
            ix += 1;
          }
        } else {
          if (block == el) return ix;   // If this is our block, return the index
          ix += 1;
        }
      }
    }
  },

  // Given a layout container, returns the number
  // of block elements contained within. We can't
  // simply count the child nodes, as it may
  // contain a list, and each item counts as a
  // block.
  _numBlockElementsWithin: function(layoutContainer) {
    var count = 0;
    for(var i = 0; i < layoutContainer.childNodes.length; i++) {
      var block = layoutContainer.childNodes[i];
      if (block.tagName.toLowerCase() == 'ol' || block.tagName.toLowerCase() == 'ul') {
        count += block.childNodes.length;
      } else {
        count++;
      }
    }
    return count;
  },

  // The offsets returned by selection objects are
  // relative to their parent node, not the char
  // offset within the element. Convert them.
  // Adapted from http://stackoverflow.com/a/4812022/889232
  _measureTextOffset: function(offset, node, element, range, start) {
    if (window.getSelection) {
      var textRange = range.cloneRange();
      textRange.selectNodeContents(element);
      textRange.setEnd(node, offset);
      return textRange.toString().length;
    } else if (document.selection) {
      var textRange = doc.body.createTextRange();
      textRange.moveToElementText(element);
      textRange.setEndPoint(start ? "StartToEnd" : "EndToEnd", range);
      return textRange.text.length;
    }
  }

};

// ------------------------------------------------
//  Document
// ------------------------------------------------
//  A document is made up of blocks (which may be
//  paragraphs, list items, images etc.)
// ------------------------------------------------

MediumEditor.DocumentModel = MediumEditor.Model.extend({

  // ----------------------------------------------
  //  Constructor
  // ----------------------------------------------

  init: function(attrs) {
    this._super(attrs);

    // Our collection of block models. Use the
    // Model-DOM mapper to parse the given HTML
    // string (assuming one was provided) into a
    // collection of block models.
    this._blocks = MediumEditor.ModelDOMMapper.parseHTMLIntoBlockCollection({
      document: this,
      html: attrs['html'] || '<p></p>'
    });

    // Attach changed event listeners
    for(var i = 0; i < this._blocks.size(); i++) {
      this.on('changed', this._blocks.at(i), this._onBlockChanged.bind(this));
    }
  },

  // ----------------------------------------------
  //  Event handlers
  // ----------------------------------------------

  _onBlockChanged: function() {
    this.trigger('changed');
  },

  // ----------------------------------------------
  //  Accessors
  // ----------------------------------------------

  blocks: function() {
    return this._blocks;
  },

  isBlank: function() {
    return this._blocks.size() == 1 && this._blocks.at(0).text() == '';
  },

  // ----------------------------------------------
  //  Mutators
  // ----------------------------------------------

  removeBlockAt: function(ix) {
    this._blocks.removeAt(ix);
    this.trigger('changed');
  },

  insertBlockAt: function(type, index, attributes) {
    attributes = typeof attributes === 'undefined' ? {} : attributes;
    attributes['type'] = type;
    var newBlock = new MediumEditor.BlockModel(attributes);
    this.on('changed',newBlock, this._onBlockChanged.bind(this));
    this._blocks.insertAt(newBlock, index);
    this.trigger('changed');
  },

  toggleMarkup: function(type, selection) {

    // Run through every block in the selection
    for(var i = selection._startIx; i <= selection._endIx; i++) {
      var block = this._blocks.at(i);

      // Determine the start and end offsets of the
      // selection in this block
      var startOffset = i == selection.startIx() ? selection.startOffset() : 0;
      var endOffset = i == selection.endIx() ? selection.endOffset() : block.text().length;

      // Mark it up
      if (startOffset != endOffset) {
        block.markup(startOffset, endOffset, type, { silent: true });
      }
    }
    this.trigger('changed');
  },

  setType: function(newType, selection) {
    for(var i = selection._startIx; i <= selection._endIx; i++) {
      var block = this._blocks.at(i);
      block.setType(newType, { silent: true });
    }
    this.trigger('changed');
  },

  setLayout: function(type, selection) {
    for(var i = selection._startIx; i <= selection._endIx; i++) {
      var block = this._blocks.at(i);
      block.setLayout(type, { silent: true });
    }
    this.trigger('changed');
  }

});

// ------------------------------------------------
//  Block
// ------------------------------------------------
//  Blocks belong to documents and represent the
//  semantic components within, such as paragraphs,
//  list items, images etc. They contain text,
//  markups, metadata and layout settings.
//  Currently supported types:
//
//    PARAGRAPH
//    QUOTE
//    HEADING1
//    HEADING2
//    HEADING3
//    ORDERED_LIST_ITEM
//    UNORDERED_LIST_ITEM
//    DIVIDER
//    IMAGE
//    VIDEO
// ------------------------------------------------

MediumEditor.BlockModel = MediumEditor.Model.extend({

  // ----------------------------------------------
  //  Constructor
  // ----------------------------------------------

  init: function(attrs) {
    this._super(attrs);
    this._setAttributes(attrs);
  },

  // ----------------------------------------------
  //  Type Queries
  // ----------------------------------------------

  isParagraph: function() {
    return this._type == 'PARAGRAPH';
  },

  isQuote: function() {
    return this._type == 'QUOTE';
  },

  isHeading1: function() {
    return this._type == 'HEADING1';
  },

  isHeading2: function() {
    return this._type == 'HEADING2';
  },

  isHeading3: function() {
    return this._type == 'HEADING3';
  },

  isHeading: function() {
    return this.isHeading1() ||
           this.isHeading2() ||
           this.isHeading3();
  },

  isOrderedListItem: function() {
    return this._type == 'ORDERED_LIST_ITEM';
  },

  isUnorderedListItem: function() {
    return this._type == 'UNORDERED_LIST_ITEM';
  },

  isDivider: function() {
    return this._type == 'DIVIDER';
  },

  isImage: function() {
    return this._type == 'IMAGE';
  },

  isVideo: function() {
    return this._type == 'VIDEO';
  },

  isText: function() {
    return this.isParagraph() ||
           this.isQuote() ||
           this.isHeading() ||
           this.isListItem();
  },

  isMedia: function() {
    return this.isImage() ||
           this.isVideo();
  },

  isListItem: function() {
    return this.isOrderedListItem() ||
           this.isUnorderedListItem();
  },

  // ----------------------------------------------
  //  Accessors
  // ----------------------------------------------

  type: function() {
    return this._type;
  },

  text: function() {        // Not relevant for some blocks e.g. dividers, media
    return this._text;
  },

  layout: function() {      // Only relevant for quotes and media at this stage
    return this._layout;
  },

  markups: function() {     // Only relevant for block types which contain text
    return this._markups;
  },

  metadata: function() {    // Only relevant for media at this stage
    return this._metadata;
  },

  isEmpty: function() {
    return this.isText() && this._text == '';
  },

  supportsMarkupType: function(markupType) {
    switch(markupType) {
      case 'STRONG':
      case 'EMPHASIS':
        return this.isText() && !this.isHeading();
      case 'ANCHOR':
        return this.isText();
    }
  },

  supportsLayout: function() {
    return this.isMedia() || this.isQuote();
  },

  supportsMetadata: function() {
    return this.isMedia();
  },

  // Return true if every character within the
  // given offset range is marked up with the given
  // type
  isRangeMarkedUpAs: function(type, startOffset, endOffset) {
    return this._markups && this._markups.isRangeMarkedUpAs(type, startOffset, endOffset);
  },

  // ----------------------------------------------
  //  Mutators
  // ----------------------------------------------

  setType: function(newType, attrs, options) {
    if (this._type != newType) {
      var newAttrs = {
        type:   newType,
        text:   this._text,
      };
      for (var attrname in attrs) { newAttrs[attrname] = attrs[attrname]; }
      this._setAttributes(newAttrs);
      if (!options || !options['silent']) this.trigger('changed');
    }
  },

  setText: function(text) {
    if (this._text != text) {
      this._shiftMarkupOffsets(text);
      this._text = text;
      this.trigger('changed');
    }
  },

  setLayout: function(layout, options) {
    if (this._layout != layout) {
      this._layout = layout;
      if (!options || !options['silent']) this.trigger('changed');
    }
  },

  // Marks up text in the given range with the
  // given type. Or, if the entire range is already
  // marked up in the type, unmarks it.
  markup: function(startOffset, endOffset, type, options) {
    if (!this.supportsMarkupType(type)) return;

    // The `MediumEditor.MarkupCollection.add`
    // method takes care of this behaviour
    this._markups.add(new MediumEditor.MarkupModel({ type: type, start: startOffset, end: endOffset }));
    if (!options || !options['silent']) this.trigger('changed');
  },

  setMetadata: function(key, value) {
    if (this._metadata[key] != value) {
      this._metadata[key] = value;
      this.trigger('changed');
    }
  },

  // Called by the constructor and by setType. Sets
  // the given attributes (and provides defaults)
  // and nulls any which aren't appropriate for the
  // type (e.g. metadata on a paragraph element)
  _setAttributes: function(attrs) {
    this._type = attrs['type'] || 'PARAGRAPH';
    this._text = this.isText() ? (attrs['text'] || '') : null;
    this._layout = this.supportsLayout() ? (attrs['layout'] || 'SINGLE-COLUMN') : 'SINGLE-COLUMN';
    this._markups = this.isText() ? new MediumEditor.MarkupCollection() : null;
    this._metadata = this.supportsMetadata() ? (attrs['metadata'] || {}) : null;
  },

  // When text changes in a block, we need to
  // modify the markup offsets. For example, if we
  // remove a character from index 3 and we have a
  // markup from offset 7 to offset 15, those
  // indices need to be reduced by one. We use a
  // text diff algorithm for determining how many
  // characters were added/removed and from where.
  _shiftMarkupOffsets: function(newText) {

    if (this._markups.size() == 0) return;  // Quick exit

    // Will return an object in the form
    // { type: 'add', start: 3, added: 1, removed: 2 }
    // where type is add, remove, replace or none.
    var difference = MediumEditor.Util.diff(this._text, newText);

    if (difference.type == 'none') return;  // No change

    // If we're removing or replacing (which we
    // implement as simply removing then adding),
    // every offset greater than the start gets
    // shifted backward by the number of characters
    // removed (clamped to the start index)
    if (difference.type == 'remove' || difference.type == 'replace') {

      for(var i = 0; i < this._markups.size(); i++) {
        var markup = this._markups.at(i);
        if (markup.start() > difference.start) {
          markup.setStart(Math.max(difference.start, markup.start() - difference.removed), { silent: true });
        }
        if (markup.end() > difference.start) {
          markup.setEnd(Math.max(difference.start, markup.end() - difference.removed), { silent: true });
        }
        if (markup.start() == markup.end()) {
          this._markups.removeAt(i);
          i--;
        }
      }
    }

    // If we're adding or replacing, every offset
    // greater than or equal to the start gets
    // shifted forward by the number of characters
    // added
    if (difference.type == 'add' || difference.type == 'replace') {

      for(var i = 0; i < this._markups.size(); i++) {
        var markup = this._markups.at(i);
        if (markup.start() >= difference.start) {
          markup.setStart(Math.max(difference.start, markup.start() + difference.added), { silent: true });
        }
        if (markup.end() >= difference.start) {
          markup.setEnd(Math.max(difference.start, markup.end() + difference.added), { silent: true });
        }
      }
    }
  }
});

// ------------------------------------------------
//  Markup
// ------------------------------------------------
//  Markups describe formatting (such as strong or
//  emphasis), or links. They have start and end
//  values, which correspond to the start and end
//  character indices of the block to which they
//  belong. Currently supported types:
//
//    STRONG
//    EMPHASIS
//    ANCHOR
// ------------------------------------------------

MediumEditor.MarkupModel = MediumEditor.Model.extend({

  // ----------------------------------------------
  //  Constructor
  // ----------------------------------------------

  init: function(attrs) {
    this._super(attrs);
    this._setAttributes(attrs);
  },

  // ----------------------------------------------
  //  Type Queries
  // ----------------------------------------------

  isStrong: function() {
    return this._type == 'STRONG';
  },

  isEmphasis: function() {
    return this._type == 'EMPHASIS';
  },

  isAnchor: function() {
    return this._type == 'ANCHOR';
  },

  // ----------------------------------------------
  //  Accessors
  // ----------------------------------------------

  type: function() {
    return this._type;
  },

  start: function() {
    return this._start;
  },

  end: function() {
    return this._end;
  },

  metadata: function() {    // Only relevant for anchors at this stage
    return this._metadata;
  },

  // Does this markup touch another?
  touches: function(other) {
    return this._start <= other._end && this._end >= other._start;
  },

  // Does this markup cover another?
  covers: function(other) {
    return this._start <= other._start && this._end >= other._end;
  },

  supportsMetadata: function() {
    return this.isAnchor();
  },

  // ----------------------------------------------
  //  Mutators
  // ----------------------------------------------

  setStart: function(start, options) {
    this._start = start;
    if (!options || !options['silent']) this.trigger('changed');
  },

  setEnd: function(end, options) {
    this._end = end;
    if (!options || !options['silent']) this.trigger('changed');
  },

  setMetadata: function(key, value) {
    if (this._metadata[key] != value) {
      this._metadata[key] = value;
      this.trigger('changed');
    }
  },

  // Set the given attributes (and provides
  // defaults) and nulls any which aren't
  // appropriate for the type (e.g. metadata on a
  // strong markup)
  _setAttributes: function(attrs) {
    this._type = attrs['type'] || 'STRONG';
    this._start = attrs['start'] || 0;
    this._end = attrs['end'] || 0;
    this._metadata = this.supportsMetadata() ? (attrs['metadata'] || {}) : null;

    // Swap start and end if end comes before start
    if (this._start > this._end) {
      var temp = this._end;
      this._end = this._start;
      this._start = temp;
    }

    // Ensure the markup spans at least one
    // character
    if (this._start == this._end) {
      throw 'Start and end points of markup must be separate';
    }
  }

});

// ------------------------------------------------
//  Selection
// ------------------------------------------------
//  Models the selection. This never gets
//  persisted - it's only really a model because
//  other models (such as document) rely upon it.
//  Currently supported types:
//
//    NULL
//    CARET
//    RANGE
//    MEDIA
// ------------------------------------------------

MediumEditor.SelectionModel = MediumEditor.Model.extend({

  // ----------------------------------------------
  //  Constructor
  // ----------------------------------------------

  init: function(attrs) {
    this._super(attrs);
    this._setAttributes(attrs);
    this._determineType();
  },

  // ----------------------------------------------
  //  Type Queries
  // ----------------------------------------------

  isNull: function() {
    return this._type == 'NULL';
  },

  isCaret: function() {
    return this._type == 'CARET';
  },

  isRange: function() {
    return this._type == 'RANGE';
  },

  isMedia: function() {
    return this._type == 'MEDIA';
  },

  // ----------------------------------------------
  //  Accessors
  // ----------------------------------------------

  type: function() {
    return this._type;
  },

  startIx: function() {
    return this._startIx;
  },

  endIx: function() {
    return this._endIx;
  },

  startOffset: function() {
    return this._startOffset;
  },

  endOffset: function() {
    return this._endOffset;
  },

  startBlock: function() {
    return this.isNull() ? null : this._document.blocks().at(this._startIx);
  },

  endBlock: function() {
    return this.isNull() ? null : this._document.blocks().at(this._endIx);
  },

  withinOneBlock: function() {
    return this._startIx == this._endIx;
  },

  spansBlocks: function() {
    return !this.withinOneBlock();
  },

  // ----------------------------------------------
  //  Mutators
  // ----------------------------------------------

  null: function() {
    this._setAttributes({});
  },

  media: function(ix) {
    this.caret(ix, 0);
  },

  caret: function(ix, offset, options) {
    this._setAttributes({
      startIx:      ix,
      startOffset:  offset,
      endIx:        ix,
      endOffset:    offset,
    });
  },

  set: function(attrs, options) {
    this._setAttributes(attrs, options);
  },

  // If a block changes type (e.g. from paragraph
  // to media) the selection type may change.
  redetermineType: function() {
    var oldType = this._type;
    this._determineType();
    if (oldType != this._type) {
      this.trigger('changed', this);
    }
  },

  _setAttributes: function(attrs, options) {

    // Set default options. Supported options are
    // `triggerEvent` (boolean) and `caller` (the
    // object which is requesting the change, so
    // objects which both subscribe to selection
    // change events and cause them can avoid
    // infinite loops in their handlers).
    if (typeof options === 'undefined') options = {};
    if (typeof options['triggerEvent'] === 'undefined') options['triggerEvent'] = true;

    if (attrs['startIx']      != this._startIx ||
        attrs['startOffset']  != this._startOffset ||
        attrs['endIx']        != this._endIx ||
        attrs['endOffset']    != this._endOffset) {
          this._startIx = attrs['startIx'];
          this._startOffset = attrs['startOffset'];
          this._endIx = attrs['endIx'];
          this._endOffset = attrs['endOffset'];
          this._determineType();
          if (options['triggerEvent']) this.trigger('changed', this, options['caller']);
    }
    if (attrs['document']) this._document = attrs['document'];
  },

  // Automatically determine the selection type
  // based upon the attributes
  _determineType: function() {
    if (this._startIx === undefined) {
      this._type = 'NULL';
    } else if (this._startOffset == 0 && this._document.blocks().at(this._startIx).isMedia()) {
      this._type = 'MEDIA';
    } else if (this._startIx == this._endIx && this._startOffset == this._endOffset) {
      this._type = 'CARET';
    } else {
      this._type = 'RANGE';
    }
  }

});

// ------------------------------------------------
//  Block
// ------------------------------------------------

MediumEditor.BlockCollection = MediumEditor.Collection.extend({

  // ----------------------------------------------
  //  Constructor
  // ----------------------------------------------
  
  init: function(attrs) {
    this._super(attrs);
  },
});

// ------------------------------------------------
//  Markup
// ------------------------------------------------

MediumEditor.MarkupCollection = MediumEditor.Collection.extend({

  // ----------------------------------------------
  //  Constructor
  // ----------------------------------------------

  init: function(attrs) {
    this._super(attrs);
  },

  // Override the add method to implement toggle
  // behaviour and normalise the markup.
  //
  // Scenarios (where A is the new markup and B
  // is an existing markup of the same type):
  //
  //    AAAAA     New markup covers old
  //     BBB      Remove B (AAAAA)
  //
  //     AAA      New markup is within old
  //    BBBBB     Un-mark the existing range (B   A)
  //
  //     AAA      New and existing are the same
  //     BBB      Unmark, leaving nothing ()
  //
  //    AAA       New partially covers old
  //      BBB     Extend A's range (AAABB) and remove B
  //
  //      AAA     New partially covers old
  //    BBB       Extend A's range (AAABB) and remove B
  //
  //    AA        New is consecutive to existing
  //      BBB     Extend A's range (AAAAA) and remove B
  //
  //       AA     New is consecutive to existing
  //    BBB       Extend A's range (AAAAA) and remove B
  //
  //      A       New would joined two existing
  //    BB CC     Will be handled in two steps
  //
  //    AA        New and existing are separate
  //       BB     Add the new (AA BB)
  //
  // Anchors are a special case. If new and
  // existing items have the same href, they act
  // like other markups. If the hrefs are different,
  // the new href is applied and subsumes the
  // existing range of any overlapping anchors.

  add: function(item) {

    // Get markups of the same type and sort
    // them by start index
    var others = this._otherItemsOfSameType(item);
    others.sort(function(a,b) { return a.start() - b.start() });

    // Run through the others
    for(var i = 0; i < others.length; i++) {
      var other = others[i];

      if (other.covers(item)) {

        //  AAA
        // BBBBB                    <-- Toggle (B   A)
        this._toggle(other, item);
        return;                     // We can exit here because A was within B, so there shouldn't be any further interactions

      } else if (other.touches(item)) {

        // If the items are not anchors with the
        // same hrefs, extend the new item's range
        // and remove the existing
        if (!item.isAnchor() || item.metadata()['href'] == other.metadata()['href']) {

          item.setStart(Math.min(other.start(), item.start()));
          item.setEnd(Math.max(other.end(), item.end()));
          this.remove(other);

        } else {

          // Anchors with different hrefs. Keep
          // both, but separate their ranges - new
          // item gets precedence.
          if (item.covers(other)) {
            this.remove(other);
          } else {
            other.setStart(Math.max(other.start(), item.end()));
            other.setEnd(Math.min(other.end(), item.start()));
          }
        }
      }
    }

    this._super(item);
  },

  // Returns true if the given range is entirely
  // marked up as the given type, otherwise false.
  isRangeMarkedUpAs: function(type, startOffset, endOffset) {
    var items = this._itemsOfType(type);
    for(var i = 0; i < items.length; i++) {
      var item = items[i];
      if (item.isAnchor()) {
        // Anchors are a special case
        if (item.start() <= startOffset) {
          if (item.end() >= endOffset) return true;
          startOffset = item.end();
        }
      } else {
        if (item.start() <= startOffset && item.end() >= endOffset) return true;
      }
    }
    return false;
  },

  // Given a markup object, returns other markups
  // of the same kind in the collection
  _otherItemsOfSameType: function(subject) {
    var others = this._itemsOfType(subject.type());
    var ix = others.indexOf(subject);
    if (ix >= 0) others.splice(ix, 1);
    return others;
  },

  _itemsOfType: function(type) {
    var toReturn = [];
    for (var i = 0; i < this.size(); i++) {
      var x = this.at(i);
      if (x.type() == type) toReturn.push(x);
    }
    return toReturn;
  },

  // Given an existing item and a new item, where
  // the existing item entirely covers the new item,
  // toggle the markup so only the sections outside
  // the new item remain. This may involve updating
  // the existing item, removing it or adding
  // another.
  _toggle: function(existingItem, newItem) {
    if (!existingItem.covers(newItem)) return;

    var beforeStart = existingItem.start();
    var beforeEnd = newItem.start();
    var afterStart = newItem.end();
    var afterEnd = existingItem.end();

    if (beforeStart == beforeEnd && afterStart == afterEnd) {

      // The two share the same range. Just remove
      // existing.
      this.remove(existingItem);

    } else if (beforeStart == beforeEnd) {

      // The new item is aligned to the left
      // boundary of the existing. Update the
      // existing's range.
      existingItem.setStart(afterStart);

    } else if (afterStart == afterEnd) {

      // The new item as aligned to the right
      // boundary of the existing. Update the
      // existing's range.
      existingItem.setEnd(beforeEnd);

    } else {

      // The new and existing items do not share
      // any boundaries.
      existingItem.setEnd(beforeEnd);
      this.add(new MediumEditor.MarkupModel({ type: newItem.type(), start: afterStart, end: afterEnd }));
    }

    // Add the new item if it's an anchor and the
    // href differs to the existing item
    if(newItem.isAnchor() && newItem.metadata()['href'] == existingItem.metadata()['href']) {
      this.add(newItem);
    }
  }

});

// ------------------------------------------------
//  Inline Tooltip Menu
// ------------------------------------------------
//  Appears next to a blank paragraph. Allows it
//  to be converted to an image, a video or a
//  divider.
// ------------------------------------------------

MediumEditor.InlineTooltipMenuView = MediumEditor.View.extend({

  BUTTONS: {
    'toggle':   '<i class="ion-ios-plus-empty"></i>',
    'image':    '<i class="ion-ios-camera-outline"></i>',
    // 'video':    '<i class="ion-ios-videocam-outline"></i>',
    'divider':  '<i class="ion-ios-minus-empty"></i>'
  },

  CLASS_NAME:             'medium-editor-inline-tooltip',

  ACTIVE_CLASS_NAME:      'medium-editor-inline-tooltip-active',

  OPEN_CLASS_NAME:        'medium-editor-inline-tooltip-open',

  TOGGLE_CLASS_NAME:      'medium-editor-inline-tooltip-toggle',

  BUTTON_SET_CLASS_NAME:  'medium-editor-inline-tooltip-button-set',

  // ----------------------------------------------
  //  Constructor
  // ----------------------------------------------

  init: function(attrs) {
    this._super(attrs);
    this._editor = attrs['editor'];

    // Listen for changes to the selection - if it
    // changes to a caret on an empty paragraph,
    // show and position, otherwise hide.
    this.on('changed', this._selection().model(), this._onSelectionChanged.bind(this));

    // Perform an initial render
    this._render();
  },

  // ----------------------------------------------
  //  Event Handlers
  // ----------------------------------------------

  _onSelectionChanged: function() {
    var selectionModel = this._selection().model();
    var selectedBlock = selectionModel.startBlock();
    if (selectionModel.isCaret() &&
        selectedBlock.isParagraph() &&
        selectedBlock.isEmpty()) {
        this._showAndPosition();
    } else {
      this._hide();
    }
  },

  // ----------------------------------------------
  //  Utility Methods
  // ----------------------------------------------

  _render: function() {

    // Create the element
    this._el = document.createElement('div');
    this._el.className = this.CLASS_NAME;

    // Create the toggle button
    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = this.TOGGLE_CLASS_NAME;
    toggle.innerHTML = this.BUTTONS.toggle;
    this.on('click', toggle, this._toggle.bind(this));
    this._el.appendChild(toggle);

    // Create the button set
    var buttonSet = document.createElement('div');
    buttonSet.className = this.BUTTON_SET_CLASS_NAME;
    this._el.appendChild(buttonSet);

    // Create buttons
    for (var action in this.BUTTONS) {
      if (this.BUTTONS.hasOwnProperty(action) && action != 'toggle') {
        var button = document.createElement('button');
        button.type = 'button';
        button.innerHTML = this.BUTTONS[action];
        button.setAttribute('data-action', action);
        this.on('click', button, this._onButton.bind(this));
        buttonSet.appendChild(button);
      }
    }
  },

  _showAndPosition: function() {
    var rectangle = this._selection().rectangle();
    this._el.style.top = rectangle.top + 'px';
    this._el.style.left = rectangle.left + 'px';
    this._el.className = [this.CLASS_NAME, this.ACTIVE_CLASS_NAME].join(' ');
  },

  _toggle: function() {
    var baseClasses = [this.CLASS_NAME, this.ACTIVE_CLASS_NAME];
    if (this._el.className.indexOf(this.OPEN_CLASS_NAME) < 0) {
      baseClasses.push(this.OPEN_CLASS_NAME);
    }
    this._el.className = baseClasses.join(' ');
  },

  _onButton: function(e) {
    var action = e.currentTarget.getAttribute('data-action');
    var selectionModel = this._selection().model();
    switch(action) {
      case 'image':
        this._insertImage();
        break;
      case 'video':

        break;
      case 'divider':
        selectionModel.startBlock().setType('DIVIDER');
        selectionModel.caret(selectionModel._startIx + 1, 0);
        break;
    }
  },

  // Insert an image, replacing the current block
  _insertImage: function() {

    // Create a hidden file input
    var fileInput = document.createElement('input');
    fileInput.type = 'file';

    // When the value changes (the user selects a
    // file or cancels the dialog)
    this.on('change', fileInput, (function(e) {

      // If they selected a file ...
      if (fileInput.files && fileInput.files[0]) {

        // Read the file
        var reader = new FileReader();
        reader.onload = (function(e) {

          // Replace the current block with a
          // figure containing the image
          this._selection().model().startBlock().setType('IMAGE', { metadata: { src: e.target.result } });
          this._selection().model().redetermineType();

        }).bind(this);
        reader.readAsDataURL(fileInput.files[0]);
      }

    }).bind(this));

    // Simulate a click so the dialog opens
    var ev = document.createEvent('Events');
    ev.initEvent('click', true, false);
    fileInput.dispatchEvent(ev);
  },

  _hide: function() {
    this._el.className = this.CLASS_NAME;
  },

  // Shorthand
  _selection: function() {
    return this._editor.selection();
  },

});

// ------------------------------------------------
//  Highlight Menu
// ------------------------------------------------
//  Appears over the top of highlighted text and
//  media objects. Allows markups and formatting
//  changes.
// ------------------------------------------------

MediumEditor.HighlightMenuView = MediumEditor.View.extend({

  CLASS_NAME:                 'medium-editor-highlight-menu',

  ACTIVE_CLASS_NAME:          'medium-editor-highlight-menu-active',

  POSITION_UNDER_CLASS_NAME:  'medium-editor-highlight-menu-under',

  BUTTON_ACTIVE_CLASS_NAME:   'medium-editor-highlight-menu-button-active',

  BUTTONS: {

    // --------------------------------------------
    //  Strong (bold) button
    // --------------------------------------------

    'STRONG': {
      buttonHTML: function() {
        return 'B';
      },
      isVisible: function() {
        return this._allBlocksSupportMarkup('STRONG');
      },
      buttonClass: function() {
        if (this._markedUpAs('STRONG')) {
          return this.BUTTON_ACTIVE_CLASS_NAME;
        } else {
          return null;
        }
      },
      onClick: function() {
        this._model.toggleMarkup('STRONG', this._selectionModel());
      }
    },

    // --------------------------------------------
    //  Emphasis (italic) button
    // --------------------------------------------

    'EMPHASIS': {
      buttonHTML: function() {
        return 'i';
      },
      isVisible: function() {
        return this._allBlocksSupportMarkup('EMPHASIS');
      },
      buttonClass: function() {
        if (this._markedUpAs('EMPHASIS')) {
          return this.BUTTON_ACTIVE_CLASS_NAME;
        } else {
          return null;
        }
      },
      onClick: function() {
        this._model.toggleMarkup('EMPHASIS', this._selectionModel());
      }
    },

    // --------------------------------------------
    //  Heading 1 button
    // --------------------------------------------

    'HEADING1': {
      buttonHTML: function() {
        return 'H1';
      },
      isVisible: function() {
        return this._noMediaBlocks();
      },
      buttonClass: function() {
        if (this._allBlocksAre('HEADING1')) {
          return this.BUTTON_ACTIVE_CLASS_NAME;
        } else {
          return null;
        }
      },
      onClick: function() {
        if (this._allBlocksAre('HEADING1')) {
          this._model.setType('PARAGRAPH', this._selectionModel());
        } else {
          this._model.setType('HEADING1', this._selectionModel());
        }
      }
    },

    // --------------------------------------------
    //  Heading 2 button
    // --------------------------------------------

    'HEADING2': {
      buttonHTML: function() {
        return 'H2';
      },
      isVisible: function() {
        return this._noMediaBlocks();
      },
      buttonClass: function() {
        if (this._allBlocksAre('HEADING2')) {
          return this.BUTTON_ACTIVE_CLASS_NAME;
        } else {
          return null;
        }
      },
      onClick: function() {
        if (this._allBlocksAre('HEADING2')) {
          this._model.setType('PARAGRAPH', this._selectionModel());
        } else {
          this._model.setType('HEADING2', this._selectionModel());
        }
      }
    },

    // --------------------------------------------
    //  Heading 3 button
    // --------------------------------------------

    'HEADING3': {
      buttonHTML: function() {
        return 'H3';
      },
      isVisible: function() {
        return this._noMediaBlocks();
      },
      buttonClass: function() {
        if (this._allBlocksAre('HEADING3')) {
          return this.BUTTON_ACTIVE_CLASS_NAME;
        } else {
          return null;
        }
      },
      onClick: function() {
        if (this._allBlocksAre('HEADING3')) {
          this._model.setType('PARAGRAPH', this._selectionModel());
        } else {
          this._model.setType('HEADING3', this._selectionModel());
        }
      }
    },

    // --------------------------------------------
    //  Quote button
    // --------------------------------------------

    'QUOTE': {
      buttonHTML: function() {
        return '“';
      },
      isVisible: function() {
        return this._noMediaBlocks();
      },
      buttonClass: function() {
        if (this._allBlockQuotes()) {
          return this.BUTTON_ACTIVE_CLASS_NAME;
        } else if (this._allPullQuotes()) {
          return this.BUTTON_ACTIVE_CLASS_NAME + ' medium-editor-highlight-menu-button-pull-quote';
        } else {
          return null;
        }
      },
      onClick: function() {
        if (this._allBlockQuotes()) {
          this._model.setLayout('PULL-QUOTE', this._selectionModel());
        } else if (this._allPullQuotes()) {
          this._model.setType('PARAGRAPH', this._selectionModel());
        } else {
          this._model.setType('QUOTE', this._selectionModel());
        }
      }
    },

    // --------------------------------------------
    //  Left-align media
    // --------------------------------------------

    'LEFT-ALIGN': {
      buttonHTML: function() {
        return 'L';
      },
      isVisible: function() {
        return this._allMediaBlocks();
      },
      buttonClass: function() {
        if (this._allLayoutsAre('LEFT-ALIGN')) {
          return this.BUTTON_ACTIVE_CLASS_NAME;
        } else {
          return null;
        }
      },
      onClick: function() {
        this._model.setLayout('LEFT-ALIGN', this._selectionModel());
      }
    },

    // --------------------------------------------
    //  Left-outset media
    // --------------------------------------------

    'LEFT-OUTSET': {
      buttonHTML: function() {
        return 'LO';
      },
      isVisible: function() {
        return this._allMediaBlocks();
      },
      buttonClass: function() {
        if (this._allLayoutsAre('LEFT-OUTSET')) {
          return this.BUTTON_ACTIVE_CLASS_NAME;
        } else {
          return null;
        }
      },
      onClick: function() {
        this._model.setLayout('LEFT-OUTSET', this._selectionModel());
      }
    },

    // --------------------------------------------
    //  Single-column media
    // --------------------------------------------

    'SINGLE-COLUMN': {
      buttonHTML: function() {
        return 'S';
      },
      isVisible: function() {
        return this._allMediaBlocks();
      },
      buttonClass: function() {
        if (this._allLayoutsAre('SINGLE-COLUMN')) {
          return this.BUTTON_ACTIVE_CLASS_NAME;
        } else {
          return null;
        }
      },
      onClick: function() {
        this._model.setLayout('SINGLE-COLUMN', this._selectionModel());
      }
    },

    // --------------------------------------------
    //  Full-width media
    // --------------------------------------------

    'FULL-WIDTH': {
      buttonHTML: function() {
        return 'F';
      },
      isVisible: function() {
        return this._allMediaBlocks();
      },
      buttonClass: function() {
        if (this._allLayoutsAre('FULL-WIDTH')) {
          return this.BUTTON_ACTIVE_CLASS_NAME;
        } else {
          return null;
        }
      },
      onClick: function() {
        this._model.setLayout('FULL-WIDTH', this._selectionModel());
      }
    }
  },

  // ----------------------------------------------
  //  Constructor
  // ----------------------------------------------

  init: function(attrs) {
    this._super(attrs);
    this._editor = attrs['editor'];

    // Listen for changes to the selection - if it
    // changes to a range, show and position,
    // otherwise hide.
    this.on('changed', this._selection().model(), this._onSelectionChanged.bind(this));
    this.on('changed', this._model, this._onDocumentChanged.bind(this));

    // Perform an initial render
    this._render();
  },

  // ----------------------------------------------
  //  Event Handlers
  // ----------------------------------------------

  _onSelectionChanged: function() {
    if (this._selectionModel().isRange() || this._selectionModel().isMedia()) {
      this._updateButtonStates();   // Need to do this first so we can measure it's size accurately
      this._showAndPosition();
    } else {
      this._hide();
    }
  },

  // We listen to document changes too because the
  // block type might have changed (which means the
  // available buttons are now different), markups
  // may have been added or the layout on a media
  // item may have changed (and therefore the menu
  // needs to be shifted)
  _onDocumentChanged: function() {
    if (this._selectionModel().isRange() || this._selectionModel().isMedia()) {
      this._updateButtonStates();
      this._showAndPosition();
    }
  },

  // ----------------------------------------------
  //  Utility Methods
  // ----------------------------------------------

  _render: function() {

    // Create the element
    this._el = document.createElement('div');
    this._el.className = this.CLASS_NAME;

    // Create buttons
    for (var action in this.BUTTONS) {
      if (this.BUTTONS.hasOwnProperty(action)) {
        var button = document.createElement('button');
        button.type = 'button';
        button.innerHTML = this.BUTTONS[action].buttonHTML();
        button.setAttribute('data-action', action);
        this.on('click', button, this.BUTTONS[action].onClick.bind(this));
        this._el.appendChild(button);
      }
    }
  },

  _showAndPosition: function() {
    var rectangle = this._selection().rectangle();

    // Measure the highlight menu itself by creating
    // an invisible clone
    var clone = this._el.cloneNode(true);
    clone.style.visibility = 'hidden';
    this._el.parentNode.appendChild(clone);
    clone.className = [this.CLASS_NAME, this.ACTIVE_CLASS_NAME].join(' ');
    var highlightMenuWidth = clone.offsetWidth;
    var highlightMenuHeight = clone.offsetHeight;
    clone.parentNode.removeChild(clone);

    // Calculate x and y
    var x = (rectangle.right + rectangle.left - highlightMenuWidth) / 2.0;
    var y = rectangle.top - highlightMenuHeight;

    // Show underneath if there's not enough room
    // at the top
    classNames = [this.CLASS_NAME, this.ACTIVE_CLASS_NAME];
    if (rectangle.clientTop < highlightMenuHeight) {
      y = rectangle.bottom;
      classNames.push(this.POSITION_UNDER_CLASS_NAME);
    }

    this._el.style.top = y + 'px';
    this._el.style.left = x + 'px';
    this._el.className = classNames.join(' ');
  },

  _updateButtonStates: function() {
    for(var i = 0; i < this._el.childNodes.length; i++) {
      var button = this._el.childNodes[i];
      var action = button.dataset.action;
      button.style.display = this.BUTTONS[action].isVisible.bind(this)() ? 'inline-block' : 'none';
      button.className = this.BUTTONS[action].buttonClass.bind(this)();
    }
  },

  _hide: function() {
    this._el.className = this.CLASS_NAME;
  },

  _selection: function() {
    return this._editor.selection();
  },

  _selectionModel: function() {
    return this._selection().model();
  },

  // Do all the selected blocks support the given
  // markup type?
  _allBlocksSupportMarkup: function(type) {
    return this._allBlocks(function(block) {
      return block.supportsMarkupType(type);
    });
  },

  _markedUpAs: function(type) {
    var selModel = this._selectionModel();
    return this._allBlocks(function(block,ix) {

      // Determine the start and end offsets of the
      // selection in this block
      var startOffset = ix == selModel.startIx() ? selModel.startOffset() : 0;
      var endOffset = ix == selModel.endIx() ? selModel.endOffset() : block.text().length;

      // Is the range marked up as the given type?
      return block.isRangeMarkedUpAs(type, startOffset, endOffset);
    });
  },

  _noMediaBlocks: function() {
    return this._allBlocks(function(block) {
      return !block.isMedia();
    });
  },

  _allMediaBlocks: function() {
    return this._allBlocks(function(block) {
      return block.isMedia();
    });
  },

  _allBlockQuotes: function() {
    return this._allBlocks(function(block) {
      return block.isQuote() && block.layout() == 'SINGLE-COLUMN';
    });
  },

  _allPullQuotes: function() {
    return this._allBlocks(function(block) {
      return block.isQuote() && block.layout() == 'PULL-QUOTE';
    });
  },

  _allBlocksAre: function(type) {
    return this._allBlocks(function(block) {
      return block.type() == type;
    });
  },

  _allLayoutsAre: function(type) {
    return this._allBlocks(function(block) {
      return block.layout() == type;
    });
  },

  // Helper method to iterate all selected blocks
  // and test them against a given function.
  _allBlocks: function(func) {
    for(var i = this._selectionModel().startIx(); i <= this._selectionModel().endIx(); i++) {
      if (!func.bind(this)(this._model.blocks().at(i), i)) return false;
    }
    return true;
  }

});

// ------------------------------------------------
//  Selection
// ------------------------------------------------
//  The selection view. Doesn't actually have a
//  DOM element - just contains all the logic for
//  translating the selection model to/from the
//  browser.
// ------------------------------------------------

MediumEditor.SelectionView = MediumEditor.View.extend({

  SELECTED_MEDIA_CLASS: 'medium-editor-media-selected',

  // ----------------------------------------------
  //  Constructor
  // ----------------------------------------------

  init: function(attrs) {
    this._super(attrs);

    // Should be passed the editor
    this._editor = attrs['editor'];

    // Listen for changes to the model and reflect
    // them in the browser
    this.on('changed', this._model, this._onSelectionChanged.bind(this));
  },

  // ----------------------------------------------
  //  Event Handlers
  // ----------------------------------------------

  _onSelectionChanged: function(selection, caller) {
    if (caller != this) this.setOnBrowser();
    this.updateMediaSelections();
  },

  // ----------------------------------------------
  //  Accessors
  // ----------------------------------------------

  rectangle: function() {
    return this._rectangle;
  },

  startBlockElement: function() {
    return MediumEditor.ModelDOMMapper.getBlockElementFromIndex(this._document()._el, this._model._startIx);
  },

  endBlockElement: function() {
    return MediumEditor.ModelDOMMapper.getBlockElementFromIndex(this._document()._el, this._model._endIx);
  },

  // ----------------------------------------------
  //  Instance Methods
  // ----------------------------------------------

  updateMediaSelections: function() {
    var existing = this._editor._el.querySelector('.' + this.SELECTED_MEDIA_CLASS);
    if (existing) existing.className = existing.className.replace(new RegExp(this.SELECTED_MEDIA_CLASS,"g"), '');
    if (this._model.isMedia()) {
      this.startBlockElement().className += ' ' + this.SELECTED_MEDIA_CLASS;
    }
  },

  // Set the selection in the browser
  setOnBrowser: function() {
    if (this._model.isNull()) {

      this.deselect();

    } else {

      var range;
      if (document.createRange && window.getSelection) {

        // Normal browsers
        range = document.createRange();
        var sel = window.getSelection();
        var startMapping = MediumEditor.ModelDOMMapper.modelSpaceToDOMSpace(this._document()._el, this._model._startIx, this._model._startOffset);
        var endMapping = MediumEditor.ModelDOMMapper.modelSpaceToDOMSpace(this._document()._el, this._model._endIx, this._model._endOffset);
        range.setStart(startMapping.node, startMapping.offset);
        range.setEnd(endMapping.node, endMapping.offset);
        if (this._model.isCaret()) range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);

      } else if (document.selection && document.body.createTextRange) {

        // IE8
        range = document.body.createTextRange();
        range.moveToElementText(MediumEditor.ModelDOMMapper.getBlockElementFromIndex(this._document()._el, this._model._startIx));
        range.collapse(true);
        range.moveEnd("character", this._model._startOffset);
        range.moveStart("character", this._model._startOffset);
        range.select();
      }
      this._updateRectangle(range);
    }
  },

  // Query the browser regarding the state of the
  // selection and update the selection model
  determineFromBrowser: function(options) {

    // Set default options
    if (typeof options === 'undefined') options = {};
    options['caller'] = this;

    // Begin by getting the start and end nodes and
    // offsets from the selection, plus the range
    // object (we'll need that later)
    var startNode, startOffset, endNode, endOffset, range;
    if (window.getSelection) {

      // Normal browsers
      var sel = window.getSelection();
      if (sel.type.toLowerCase() != 'none') {
        range = sel.getRangeAt(0);
        startNode = range.startContainer;
        startOffset = range.startOffset;
        endNode = range.endContainer;
        endOffset = range.endOffset;
      }

    } else if (document.selection) {

      // IE8
      var sel = document.selection;
      range = sel.createRange();
      var startInfo = this._ieSelectionInfo(range, 'start');
      var endInfo = this._ieSelectionInfo(range, 'end');

      startNode = startInfo.node;
      startOffset = startInfo.offset;
      endNode = endInfo.node;
      endOffset = endInfo.offset;
    }

    // If there's nothing selected according to
    // the browser ...
    if (!startNode) {
      this._model.null();
      return;
    }

    // Is the selection outside the document?
    if (!this._isWithinDocument(startNode) || startNode == this._document()._el) {
      this._model.null();
      return;
    }

    // Determine the start and end indices and
    // offsets, in model space.
    var startPosition = MediumEditor.ModelDOMMapper.domSpaceToModelSpace(startNode, startOffset, range, true);
    var endPosition = MediumEditor.ModelDOMMapper.domSpaceToModelSpace(endNode, endOffset, range, false);

    // Update the rectangle
    this._updateRectangle(range);

    // Update the model
    this._model.set({
      startIx:      startPosition.ix,
      startOffset:  startPosition.offset,
      endIx:        endPosition.ix,
      endOffset:    endPosition.offset
    }, options);
  },

  deselect: function() {

    // http://stackoverflow.com/a/3169849/889232
    if (window.getSelection) {
      if (window.getSelection().empty) {  // Chrome
        window.getSelection().empty();
      } else if (window.getSelection().removeAllRanges) {  // Firefox
        window.getSelection().removeAllRanges();
      }
    } else if (document.selection) {  // IE?
      document.selection.empty();
    }
  },

  // ----------------------------------------------
  //  Utilities
  // ----------------------------------------------

  _updateRectangle: function(range_or_el) {

    // Grab the bounding client rectangle,
    // depending on whether we've been passed a
    // range object or DOM element
    var selectionRect = range_or_el.getBoundingClientRect();
    if (selectionRect.height == 0 && selectionRect.width == 0) {

      // This happens sometimes with a blank node
      // (e.g. just a <br> on a new paragraph). Get
      // the rect from the parent node instead.
      var selectionNode = range_or_el.startContainer;
      if (selectionNode.nodeType == 3 || selectionNode.tagName == 'BR') selectionNode = selectionNode.parentNode;
      selectionRect = selectionNode.getBoundingClientRect();
    }

    // Convert it to document space
    var documentRect = this._document()._el.getBoundingClientRect();
    var top = selectionRect.top - documentRect.top; var bottom = selectionRect.bottom - documentRect.top;
    var left = selectionRect.left - documentRect.left; var right = selectionRect.right - documentRect.left;

    this._rectangle = {
      top:            top,
      left:           left,
      bottom:         bottom,
      right:          right,
      clientTop:      selectionRect.top,
      clientLeft:     selectionRect.left,
      clientBottom:   selectionRect.bottom,
      clientRight:    selectionRect.right
    };
  },

  // Returns true if the document is an ancestor of
  // the given element, otherwise false.
  _isWithinDocument: function(el) {
    if (this._document()._el == el) {
      return true;
    } else if (!el.parentNode || el.parentNode.nodeType != 1) {
      return false;
    } else {
      return this._isWithinDocument(el.parentNode);
    }
  },

  // Given a range and a string value indicating
  // whether we're querying the start or end of the
  // range, return an object with properties `node`
  // and `offset` representing the DOM node and
  // offset at that end of the range. This is a
  // polyfill for IE8, adapted from
  // https://gist.github.com/Munawwar/1115251
  _ieSelectionInfo: function(range, whichEnd) {
    if(!range) return null;
    whichEnd = whichEnd.toLowerCase();
    var rangeCopy = range.duplicate(),                  // Create two copies
    rangeObj  = range.duplicate();
    rangeCopy.collapse(whichEnd == 'start');            // Collapse the range to either the start or the end

    // moveToElementText throws a fit if the user
    // clicks an input element
    var parentElement = rangeCopy.parentElement();
    if (parentElement instanceof HTMLInputElement) return null;

    // IE8 can't have the selection end at the
    // zeroth index of the parentElement's first
    // text node.
    rangeObj.moveToElementText(parentElement);          // Select all text of parentElement
    rangeObj.setEndPoint('EndToEnd', rangeCopy);        // Move end point to rangeCopy

    // Now traverse through sibling nodes to find
    // the exact node and the selection's offset.
    return this._ieFindTextNode(parentElement.firstChild, rangeObj.text);
  },

  // Given a node and some text, iterate through it
  // and its siblings until we find a text node
  // which matches the given text.
  _ieFindTextNode: function(node, text) {

    // Iterate through all the child text nodes and
    // check for matches. As we go through each
    // text node keep removing the text value
    // (substring) from the beginning of the text
    // variable.
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
  },

  // Shorthand
  _document: function() {
    return this._editor.document();
  }
});

// ------------------------------------------------
//  Editor
// ------------------------------------------------
//  Contains the actual editable document, along
//  with the highlight menu and inline tooltip.
// ------------------------------------------------

MediumEditor.EditorView = MediumEditor.View.extend({

  // ----------------------------------------------
  //  Constructor
  // ----------------------------------------------

  init: function(attrs) {
    this._super(attrs);

    // Create the editor view element
    this._el = document.createElement('div');
    this._el.className = 'medium-editor';

    // Create the selection model and view
    this._selectionModel = new MediumEditor.SelectionModel({ document: this._model });
    this._selection = new MediumEditor.SelectionView({ model: this._selectionModel, editor: this });

    // Add a document view as a child
    this._document = new MediumEditor.DocumentView({ model: this._model, editor: this });
    this._el.appendChild(this._document.el());

    // Add the inline tooltip menu
    this._inlineTooltip = new MediumEditor.InlineTooltipMenuView({ model: this._model, editor: this });
    this._el.appendChild(this._inlineTooltip.el());

    // Add the highlight menu
    this._highlightMenu = new MediumEditor.HighlightMenuView({ model: this._model, editor: this });
    this._el.appendChild(this._highlightMenu.el());

    // Add event handlers. We centralise event
    // handling here then delegate out to the
    // document view, selection, inline tooltip and
    // hover menu because the order of those
    // handlers is important.
    this.on('keyup', this._document.el(), this._onKeyUp.bind(this));
    this.on('keydown', this._document.el(), this._onKeyDown.bind(this));
    this.on('mouseup', document, this._onMouseUp.bind(this));
    this.on('paste', this._document.el(), this._onPaste.bind(this));
    this.on('mousedown', this._document._el, this._onMouseDown.bind(this));
  },

  // Listen for normal editing changes. Let them
  // complete, then flush them through the model
  // change pipeline. Note, we don't use keypress
  // here, even though it handles things like
  // holding down the button nicely, because we
  // also want to deal with backspace and other
  // keys not captured by keypress.
  _onKeyUp: function(e) {

    // Update the selection, but don't trigger the
    // selection update event. If we did that now,
    // the onSelectionChanged handlers would be
    // working from a model which hasn't had the
    // changed flushed through yet. We manually
    // trigger it further down.
    this._selection.determineFromBrowser({ triggerEvent: false });

    // Flush the changes through the pipeline and
    // handle special cases like lists and captions.
    var block = this._selectionModel.startBlock();
    var text = this._selection.startBlockElement().innerText;
    if (text == "\n") text = "";

    if (block.isParagraph() && text.match(/^1\.\s/)) {

      // Paragraphs starting with '1. ' - convert
      // to a list item
      block.setType('ORDERED_LIST_ITEM', { text: text.substring(3) });
      this._selectionModel.caret(this._selectionModel.startIx(), 0, { triggerEvent: false });

    } else if (block.isParagraph() && text.match(/^\*\s/)) {

      // Paragraphs starting with '* ' - convert
      // to a list item
      block.setType('UNORDERED_LIST_ITEM', { text: text.substring(2) });
      this._selectionModel.caret(this._selectionModel.startIx(), 0, { triggerEvent: false });

    } else {

      // Otherwise just flush through
      block.setText(text);
    }

    // Now trigger the selection event - the model
    // is up to date.
    this._selectionModel.trigger('changed', this._selectionModel, this._selection);
  },

  // Intercept key events which may modify the
  // block structure, such as enter or backspace.
  _onKeyDown: function(e) {

    var startBlock = this._selectionModel.startBlock();
    var endBlock = this._selectionModel.endBlock();

    switch(e.which) {

      // ------------------------------------------
      //  Cmd + b, cmd + i
      // ------------------------------------------

      case 66:            // b
      case 73:            // i

        // Override default behaviour, otherwise
        // contenteditable uses <b> and <i>
        if (e.metaKey) {
          if (this._selectionModel.isRange()) {
            this._model.toggleMarkup(e.which == 66 ? 'STRONG' : 'EMPHASIS', this._selectionModel);
          }
          e.preventDefault();
        }
        break;

      // ------------------------------------------
      //  Backspace
      // ------------------------------------------

      case 8:
        if (this._selectionModel.isMedia()) {

          // Media selection. Change it to a
          // paragraph.
          startBlock.setType('PARAGRAPH');
          e.preventDefault();

        } else if (this._selectionModel.isRange()) {

          if (this._selectionModel.spansBlocks()) {

            // Multiple blocks. Kill the
            // highlighted text.
            this._removeSelectedText();
            e.preventDefault();

          } else {

            // Range within the same block. Let
            // contenteditable handle it.
          }

        } else if (this._selectionModel.isCaret()) {

          var prevBlock = this._model.blocks().at(this._selectionModel.startIx() - 1);
          if (startBlock.isListItem() && this._selectionModel.startOffset() == 0) {

            // List item and selection is at offset
            // zero. Change it to a paragraph.
            startBlock.setType('PARAGRAPH');
            e.preventDefault();

          } else if (this._selectionModel.startIx() == 0 && this._selectionModel.startOffset() == 0) {

            // At offset zero in the first block of
            // the document. If it's empty and not
            // a paragraph, convert it, otherwise
            // do nothing.
            if (startBlock.isEmpty() && !startBlock.isParagraph()) {
              startBlock.setType('PARAGRAPH');
            }
            e.preventDefault();

          } else if (this._selectionModel.startOffset() == 0 && prevBlock.isDivider()) {

            // At offset zero and previous block is
            // a divider. Kill it.
            this._model.removeBlockAt(this._selectionModel.startIx() - 1);
            this._selectionModel.set(this._selectionModel.startIx() - 1, 0);
            e.preventDefault();

          } else if (this._selectionModel.startOffset() == 0 && prevBlock.isMedia()) {

            // Previous block is media. Select it.
            this._selectionModel.media(this._selectionModel.startIx() - 1);
            e.preventDefault();

          } else if (this._selectionModel.startOffset() == 0 && prevBlock.isParagraph() && prevBlock.isEmpty()) {

            // Previous block is an empty paragraph.
            // Kill it.
            this._selectionModel.caret(this._selectionModel.startIx() - 1, 0);
            this._model.removeBlockAt(this._selectionModel.startIx());
            e.preventDefault();

          } else if (this._selectionModel.startOffset() == 0) {

            // Any other scenario where we're at
            // offset zero - merge the block upward
            // into the previous.
            var prevBlockText = prevBlock.text();
            var newText = prevBlockText + startBlock.text();
            prevBlock.setText(newText);
            this._selectionModel.caret(this._selectionModel.startIx() - 1, prevBlockText.length);
            this._model.removeBlockAt(this._selectionModel.startIx() + 1);
            e.preventDefault();
          }
        }
        break;

      // ------------------------------------------
      //  Enter
      // ------------------------------------------

      case 77:                    // m - if the ctrl key is being held, it will fall through
        if (!e.ctrlKey) break;
      case 13:

        if (this._selectionModel.isRange()) {

          // Remove the selected text, but then
          // allow code to continue below. If it's
          // a paragraph selection, just clear the
          // paragraph instead of killing it.
          this._removeSelectedText({ clearIfParagraphSelection: true });
        }

        if (this._selectionModel.isCaret() && startBlock.isListItem() && startBlock.isEmpty()) {

          // If we're on a blank list item,
          // convert it to a paragraph
          startBlock.setType('PARAGRAPH');
          e.preventDefault();

        } else {

          // Not on a blank list item. Insert a new
          // block at the current selection.
          // General strategy is we split the block
          // and create a new one underneath. If
          // the new block is blank, it's a
          // paragraph (unless the parent was a
          // list item). If it has content, it
          // inherits its type from its parent. If
          // we're at offset zero, the new item is
          // placed above the current block, not
          // below.

          if (this._selectionModel.startOffset() == 0) {

            // If we're at offset 0, we're always
            // inserting a paragraph above, unless
            // it's a list item
            this._model.insertBlockAt(!startBlock.isListItem() ? 'PARAGRAPH' : startBlock.type(), this._selectionModel.startIx());

            // Give the old block focus
            this._selectionModel.caret(this._selectionModel.startIx() + 1, 0);
            e.preventDefault();

          } else {

            var text = startBlock.text();
            var textBeforeCaret = text.substring(0, this._selectionModel.startOffset());
            var textAfterCaret = text.substring(this._selectionModel.endOffset());
            var newType = textAfterCaret != '' || startBlock.isListItem() ? startBlock.type() : 'PARAGRAPH';

            this._model.insertBlockAt(newType, this._selectionModel.startIx() + 1, { text: textAfterCaret });
            startBlock.setText(textBeforeCaret);

            // Put focus on the new child paragraph
            this._selectionModel.caret(this._selectionModel.startIx() + 1, 0);
            e.preventDefault();
          }
        }
        break;

      // ------------------------------------------
      //  Any other key
      // ------------------------------------------

      default:

        // Let contenteditable handle it, unless it
        // spans multiple blocks, in which case
        // remove the highlighted text first
        // (unless it's something innocuous like an
        // arrow key).

        var systemKeys = [
          9,           // Tab
          16,          // Shift
          17,          // Ctrl
          18,          // Alt
          19,          // Pause/break
          20,          // Caps lock
          27,          // Escape
          33,          // Page up
          34,          // Page down
          35,          // End
          36,          // Home
          37,          // Left arrow
          38,          // Up arrow
          39,          // Right arrow
          40,          // Down arrow
          45,          // Insert
          91,          // Left window key
          92,          // Right window key
          93,          // Select key
        ];

        if (this._selectionModel.isRange() && this._selectionModel.spansBlocks() && systemKeys.indexOf(e.which) < 0) {
          this._removeSelectedText({ clearIfParagraphSelection: true });
        }

        break;
    }
  },

  // If the selection is a range, this method
  // removes the selected text.
  _removeSelectedText: function(options) {

    options = typeof options == 'undefined' ? {} : options;
    options['clearIfParagraphSelection'] = !!(options['clearIfParagraphSelection']);

    if (!this._selectionModel.isRange()) return;

    // Grab the blocks
    var startBlock = this._selectionModel.startBlock();
    var endBlock = this._selectionModel.endBlock();
    var startIx = this._selectionModel.startIx();
    var endIx = this._selectionModel.endIx();
    var startOffset = this._selectionModel.startOffset();
    var endOffset = this._selectionModel.endOffset();

    if (options['clearIfParagraphSelection'] && endIx == (startIx + 1) && endOffset == 0) {
      endIx = startIx;
      endOffset = startBlock.text().length;
      endBlock = startBlock;
    }

    // Determine the new block text
    var newStartBlockText = startBlock.text().substr(0, startOffset);
    newStartBlockText += endBlock.text().substr(endOffset);

    // Set the new block text
    startBlock.setText(newStartBlockText);

    // Change the selection to a caret (important
    // we do this before removing blocks, otherwise
    // the 'change' event triggered on the document
    // model will bubble up to the document view,
    // which will try to set the selection and the
    // end block may not exist anymore)
    this._selectionModel.caret(startIx, startOffset);

    // Remove the remaining blocks
    for(var i = endIx; i > startIx; i--) {
      this._model.removeBlockAt(i);
    }
  },

  _onMouseUp: function(e) {

    // We need to wrap this in a short timeout,
    // otherwise when clicking inside a range
    // selection, `window.getSelection()` still
    // returns the range.
    setTimeout(function() {
      this._selection.determineFromBrowser();
    }.bind(this), 10);
  },

  _onMouseDown: function(e) {

    // Did the user click on an image/video? If so,
    // set selection on it.
    if (e.target.tagName.toLowerCase() == 'img' &&
        e.target.parentNode.tagName.toLowerCase() == 'figure') {
      var element = e.target.parentNode;
      var ix = MediumEditor.ModelDOMMapper.getIndexFromBlockElement(element);
      this._selection.model().media(ix);
    }
  },

  _onPaste: function(e) {
    e.preventDefault();
    if (e && e.clipboardData && e.clipboardData.getData) {
      if (/text\/plain/.test(e.clipboardData.types)) {
        var text = e.clipboardData.getData('text/plain');
        var blocks = text.split("\n");
        var toInsert = [];
        for(var i = 0; i < blocks.length; i++) {
          var block = blocks[i];
          if (block != '' && block != null) {
            toInsert.push(block);
          }
        }
        for(var i = 0; i < toInsert.length; i++) {
          var block = toInsert[i];
          if (i == 0) {
            var startBlock = this._selectionModel.startBlock();
            startBlock.setText(startBlock.text() + block);
          } else {
            this._model.insertBlockAt('PARAGRAPH', this._selectionModel.startIx() + 1 + i, { text: block });
          }
        }
        this._selection.model().caret(this._selectionModel.startIx() + toInsert.length - 1, toInsert[toInsert.length - 1].length);
      }
    }
  },

  selection: function() {
    return this._selection;
  },

  document: function() {
    return this._document;
  }

});

// ------------------------------------------------
//  Document
// ------------------------------------------------
//  The document view.
// ------------------------------------------------

MediumEditor.DocumentView = MediumEditor.View.extend({

  CLASS_NAME:         'medium-editor-document',

  BLANK_CLASS_NAME:   'medium-editor-document-blank',

  // ----------------------------------------------
  //  Constructor
  // ----------------------------------------------

  init: function(attrs) {
    this._super(attrs);
    this._editor = attrs['editor'];

    // Create the document view element
    this._el = document.createElement('div');
    this._el.className = 'medium-editor-document';
    this._el.contentEditable = true;

    // Listen for changes to the document model
    this.on('changed', this._model, this._onChanged.bind(this));

    // Perform an initial render
    this._render();
  },

  // ----------------------------------------------
  //  Event Handlers
  // ----------------------------------------------

  _onChanged: function() {
    this._render();
    this._editor.selection().setOnBrowser();  // Put the selection back
  },

  // ----------------------------------------------
  //  Utility Methods
  // ----------------------------------------------

  _render: function() {
    this._el.innerHTML = MediumEditor.ModelDOMMapper.toHTML(this._model);
    this._el.className = [this.CLASS_NAME, this._model.isBlank() ? this.BLANK_CLASS_NAME : ''].join(' ');
  }

});

// ------------------------------------------------
//  Medium Editor 1.0.0
// ------------------------------------------------
//  (c) 2015 Cameron Price-Austin
//  May be freely distributed under the MIT
//  license.
// ------------------------------------------------

MediumEditor.prototype = {

  // ----------------------------------------------
  //  Constructor
  // ----------------------------------------------
  //  Ensure the platform is supported, then setup
  //  the element, models and views.
  // ----------------------------------------------

  init: function(selector_or_element, options) {

    // Ensure we can support this browser/device
    if (!this._supportedPlatform()) return false;

    // Find the element - note we don't support
    // multiple elements at this time
    if (typeof selector_or_element == 'string' || selector_or_element instanceof String) {
      this._el = document.querySelector(selector_or_element);
    } else {
      this._el = selector_or_element;
    }
    if (!this._el) return false;
    this._el.style.display = 'none';

    // Determine the starting HTML
    var startingHTML = '';
    if (this._el.tagName.toLowerCase() == 'textarea') {
      startingHTML = this._el.value;
    } else {
      startingHTML = this._el.innerHTML;
    }

    // Create the model
    this._documentModel = new MediumEditor.DocumentModel({ html: startingHTML });

    // If attached to a textarea, listen to the
    // change event and update it
    if (this._el.tagName.toLowerCase() == 'textarea') {
      this._documentModel.on('changed', this._onDocumentChanged.bind(this));
    }

    // Create the editor view and insert it into
    // the page before the given element
    this._editorView = new MediumEditor.EditorView({ model: this._documentModel });
    this._el.parentNode.insertBefore(this._editorView._el, this._el);
  },

  // ----------------------------------------------
  //  Event handlers
  // ----------------------------------------------

  _onDocumentChanged: function() {
    this._el.value = MediumEditor.ModelDOMMapper.toHTML(this._documentModel);
  },

  // ----------------------------------------------
  //  Utilities
  // ----------------------------------------------

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
};
