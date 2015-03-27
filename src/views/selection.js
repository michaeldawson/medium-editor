// ------------------------------------------------
//  Selection
// ------------------------------------------------
//  The selection view. Doesn't actually have a
//  DOM element - just contains all the logic for
//  translating the selection model to/from the
//  browser.
// ------------------------------------------------

MediumEditor.SelectionView = MediumEditor.View.extend({

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
  },

  // ----------------------------------------------
  //  Accessors
  // ----------------------------------------------

  rectangle: function() {
    return this._rectangle;
  },

  startBlockElement: function() {
    return this._getBlockElementFromIndex(this._model._startIx);
  },

  endBlockElement: function() {
    return this._getBlockElementFromIndex(this._model._endIx);
  },

  // ----------------------------------------------
  //  Instance Methods
  // ----------------------------------------------

  // Set the selection in the browser
  setOnBrowser: function() {
    if (this._model.isNull()) {

      this.deselect();

    } else if (this._model.isMedia()) {

      // Keep a handle to the selected media block
      // so we can easily unset it later
      this._selectedMediaEl = this._getBlockElementFromIndex(this._model._startIx);
      this._selectedMediaEl.className = 'medium-editor-media-selected';
      this.deselect();
      this._updateRectangle(this._selectedMediaEl);

    } else {

      var range;
      if (document.createRange && window.getSelection) {

        // Normal browsers
        range = document.createRange();
        var sel = window.getSelection();
        var mapping = this._modelSpaceToDOMSpace(this._model._startIx, this._model._startOffset);
        range.setStart(mapping.node, mapping.offset);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);

      } else if (document.selection && document.body.createTextRange) {

        // IE8
        range = document.body.createTextRange();
        range.moveToElementText(this._getBlockElementFromIndex(this._model._startIx));
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

      // Check if media is selected
      if (this._selectedMediaEl) {

        // Yep. Update the model.
        var ix = this._getIndexFromBlockElement(this._selectedMediaEl);
        this._model.set({
          startIx:      ix
        }, options);

      } else {

        // Nup. Nothing is selected.
        this._model.null();
      }
      return;
    }

    // Is the selection outside the document?
    if (!this._isWithinDocument(startNode) || startNode == this._document()._el) {
      this._model.null();
      return;
    }

    // Determine the start and end indices and
    // offsets, in model space.
    var startPosition = this._domSpaceToModelSpace(startNode, startOffset, range, true);
    var endPosition = this._domSpaceToModelSpace(endNode, endOffset, range, false);

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
    var selectionRect;
    if (this._model.isMedia()) {
      selectionRect = range_or_el.getBoundingClientRect();
    } else {

      // Grab the rectangle and convert it to
      // document space
      var selectionRect = range_or_el.getBoundingClientRect();
      if (selectionRect.height == 0 && selectionRect.width == 0) {
        // This happens sometimes with a blank node
        // (e.g. just a <br> on a new paragraph). Get
        // the rect from the parent node instead.
        var selectionNode = range_or_el.startContainer;
        if (selectionNode.nodeType == 3) selectionNode = selectionNode.parentNode;
        selectionRect = selectionNode.getBoundingClientRect();
      }
    }
    var documentRect = this._document()._el.getBoundingClientRect();
    var top = selectionRect.top - documentRect.top; var bottom = selectionRect.bottom - documentRect.top;
    var left = selectionRect.left - documentRect.left; var right = selectionRect.right - documentRect.left;
    this._rectangle = {
      top:      top,
      left:     left,
      bottom:   bottom,
      right:    right
    };
  },

  // Given a node and an offset within that node,
  // return an object containing the block index
  // and the text offset in model space.
  _domSpaceToModelSpace: function(node, offset, range, start) {
    var element = this._blockElementFromNode(node);
    var ix = this._getIndexFromBlockElement(element);
    var offset = this._measureTextOffset(offset, node, element, range, start);
    return {
      ix:       ix,
      offset:   offset
    }
  },

  // Given an index and offsets in model space,
  // return the equivalent node and offset in DOM
  // space
  _modelSpaceToDOMSpace: function(ix, offset) {
    var el = this._getBlockElementFromIndex(ix);
    var textNodes = this._getTextNodesIn(el);
    for(var i = 0; i < textNodes.length; i++) {
      var node = textNodes[i];
      if (offset <= node.length) {
        return { node: node, offset: offset };
      } else {
        offset -= node.length;
      }
    }
    return { node: el.childNodes[0], offset: Math.min(el.childNodes[0].innerText.length, offset) };
  },

  // Given an index in model space, return the
  // corresponding block DOM element, considering
  // layout and other containers
  _getBlockElementFromIndex: function(ix) {
    for (var i = 0; i < this._document()._el.children.length; i++) {
      var layoutContainer = this._document()._el.childNodes[i];
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

  // Given a block element, determine what the
  // index is within model space, considering
  // layout and other containers
  _getIndexFromBlockElement: function(el) {

    var docView = this._document()._el;
    var ix = 0;

    // Iterate every layout container
    for(var i = 0; i < docView.children.length; i++) {
      var layoutContainer = docView.children[i];

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
    if (this._document()._el == el) {
      return true;
    } else if (!el.parentNode || el.parentNode.nodeType != 1) {
      return false;
    } else {
      return this._isWithinDocument(el.parentNode);
    }
  },

  // Given a node, returns the block element it
  // belongs to. This assumes the node exists
  // within a block in the editor.
  _blockElementFromNode: function(node) {
    while (node.parentNode.tagName.toLowerCase() != 'div' &&  // Bit hacky - layout containers are the only divs
           node.parentNode.tagName.toLowerCase() != 'ol' &&
           node.parentNode.tagName.toLowerCase() != 'ul') {
      node = node.parentNode;
      if (node.parentNode == document.body) return null;
    }
    return node;
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
