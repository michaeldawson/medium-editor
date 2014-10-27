// ---------------------------------------------
//  Selection
// ---------------------------------------------
//  Selection is a special case. It's not
//  really a model (it has links to the block
//  views, and the model of a document needs no
//  concept of 'selection'), but it's also not
//  a view (it has no DOM element, even though
//  it's represented visually in the editor).
//
//  Instead, we model it as a utility class,
//  extending the MVC base so it can still
//  access the event helpers.
// ---------------------------------------------

MediumEditor.Selection = MediumEditor.MVC.extend({

  // ---------------------------------------------
  //  Permitted Selection Types
  // ---------------------------------------------

  TYPES: {
    NULL:                 {},
    CARET:                {},
    RANGE:                {}
  },

  // ---------------------------------------------
  //  Constructor
  // ---------------------------------------------

  init: function(attrs) {

    // Should be passed the document model and the
    // editor element
    this._model = attrs['model'];
    this._editorEl = attrs['editorEl'];
    this._documentEl = this._editorEl.firstChild;

    // Setup the attributes
    this.null();

    // Listen for any events which may modify the
    // selection. Note, we listen to the document
    // element because there may be keyup events
    // in the highlight menu which are irrelevant.
    this.on('keyup', this._documentEl, this._onKeyUp.bind(this));
    this.on('mouseup', document, this._onMouseUp.bind(this));     // Listen to document in case the editor loses focus

    // Listen for new blocks being added and give
    // them focus
    this.on('add', this._model.children, this._onBlockAdded.bind(this));
  },

  // ---------------------------------------------
  //  Event Handlers
  // ---------------------------------------------

  _onKeyUp: function(e) {
    this._determine();
  },

  _onMouseUp: function(e) {
    this._determine();
  },

  // Whenever a new block is added, give it focus
  _onBlockAdded: function(block, ix) {
    this.select(ix, 0);
  },

  // ---------------------------------------------
  //  Accessors
  // ---------------------------------------------

  text: function() {
    return this._documentEl.childNodes[this._startIx].innerText;
  },

  isRange: function() {
    return this._type == this.TYPES.RANGE;
  },

  rectangle: function() {
    return this._rectangle;
  },

  // ---------------------------------------------
  //  Mutators
  // ---------------------------------------------

  // Given a block index and a text offset, set
  // the selection in the browser.
  select: function(ix, offset) {
    if (document.createRange && window.getSelection) {

      // Normal browsers
      var range = document.createRange();
      var sel = window.getSelection();
      var mapping = this._translateToNodeSpace(ix, offset);
      range.setStart(mapping.node, mapping.offset);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);

    } else if (document.selection && document.body.createTextRange) {

      // IE8
      var textRange = document.body.createTextRange();
      textRange.moveToElementText(this.documentEl.childNodes[ix]);
      textRange.collapse(true);
      textRange.moveEnd("character", offset);
      textRange.moveStart("character", offset);
      textRange.select();
    }
  },

  null: function() {
    this._setAttributes({});
  },

  // ---------------------------------------------
  //  Utility Methods
  // ---------------------------------------------

  _setAttributes: function(attrs) {
    if (attrs['startIx']      != this._startIx ||
        attrs['startOffset']  != this._startOffset ||
        attrs['endIx']        != this._endIx ||
        attrs['endOffset']    != this._endOffset) {
          this._startIx = attrs['startIx'];
          this._startOffset = attrs['startOffset'];
          this._endIx = attrs['endIx'];
          this._endOffset = attrs['endOffset'];
          this._rectangle = attrs['rectangle'];
          this._cacheType();
          this._cacheModels();
          this.trigger('changed', this);
    }
  },

  // Automatically determine the selection type
  // based upon the attributes
  _cacheType: function() {
    if (this._startIx === undefined) {
      this._type = this.TYPES.NULL;
    } else if (this._startIx == this._endIx && this._startOffset == this._endOffset) {
      this._type = this.TYPES.CARET;
    } else {
      this._type = this.TYPES.RANGE;
    }
  },

  // Cache the this.startModel and this.endModel
  // models based upon the given indices
  _cacheModels: function() {
    this._startModel = this._startIx !== undefined ? this._model.children().at(this._startIx) : null;
    this._endModel = this._endIx !== undefined ? this._model.children().at(this._endIx) : null;
  },

  // Query the browser regarding the state of the
  // selection
  _determine: function() {

    // Begin by getting the start and end nodes and
    // offsets from the selection, plus the range
    // object (we'll need that later);

    var startNode, startOffset, endNode, endOffset, range;
    if (window.getSelection) {

      // Normal browsers
      var sel = window.getSelection();
      range = sel.getRangeAt(0);

      startNode = range.startContainer;
      startOffset = range.startOffset;
      endNode = range.endContainer;
      endOffset = range.endOffset;

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

    // Is the selection outside the document?
    if (!this._isWithinDocument(startNode)) {
      this.null();
      return;
    }

    // Determine the start and end indices, in the
    // context of the document blocks.
    var startElement = this._blockElementFromNode(startNode);
    var endElement = this._blockElementFromNode(endNode);
    var startIx = Array.prototype.indexOf.call(startElement.parentNode.childNodes, startElement);
    var endIx = Array.prototype.indexOf.call(endElement.parentNode.childNodes, endElement);

    // The offsets are in node-space (e.g. they map
    // to the offsets within their parent node, not
    // the character offsets within the elements).
    // Convert them.
    startOffset = this._measureTextOffset(startOffset, startNode, startElement, range, true);
    endOffset = this._measureTextOffset(endOffset, endNode, endElement, range, false);

    // Grab the rectangle and convert it to editor
    // space
    var selectionRect = range.getBoundingClientRect();
    var editorRect = this._editorEl.getBoundingClientRect();
    var top = selectionRect.top - editorRect.top; var bottom = selectionRect.bottom - editorRect.top;
    var left = selectionRect.left - editorRect.left; var right = selectionRect.right - editorRect.left;
    var rectangle = {
      top:      top,
      left:     left,
      bottom:   bottom,
      right:    right
    };

    // Update the selection
    this._setAttributes({
      startIx:      startIx,
      startOffset:  startOffset,
      endIx:        endIx,
      endOffset:    endOffset,
      rectangle:    rectangle
    });
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
    var el = this._documentEl.childNodes[ix];
    var textNodes = this._getTextNodesIn(el);
    for(var i = 0; i < textNodes.length; i++) {
      var node = textNodes[i];
      if (offset <= node.length) {
        return { node: node, offset: offset };
      } else {
        offset -= node.length;
      }
    }
    return { node: el.childNodes[0], offset: offset };
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
  },

  // Returns true if the document is an ancestor of
  // the given element, otherwise false.
  _isWithinDocument: function(el) {
    if (this._documentEl == el) {
      return true;
    } else if (!el.parentNode || el.parentNode.nodeType != 1) {
      return false;
    } else {
      return this._isWithinDocument(el.parentNode);
    }
  },

  // Given a node, returns the block element it
  // belongs to. This assumes the node exists within
  // a block in the editor.
  _blockElementFromNode: function(node) {
    while (node.parentNode != this._documentEl) {
      node = node.parentNode;
      if (node.parentNode == document.body) return null;
    }
    return node;
  },

  // Given a range and a string value indicating
  // whether we're querying the start or end of
  // the range, return an object with properties
  // `node` and `offset` representing the DOM
  // node and offset at that end of the range.
  // This is a polyfill for IE8, adapted from
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

    // IE8 can't have the selection end at the zeroth
    // index of the parentElement's first text node.
    rangeObj.moveToElementText(parentElement);          // Select all text of parentElement
    rangeObj.setEndPoint('EndToEnd', rangeCopy);        // Move end point to rangeCopy

    // Now traverse through sibling nodes to find the
    // exact node and the selection's offset.
    return this._ieFindTextNode(parentElement.firstChild, rangeObj.text);
  },

  // Given a node and some text, iterate through it
  // and its siblings until we find a text node
  // which matches the given text.
  _ieFindTextNode: function(node, text) {

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
  }
});
