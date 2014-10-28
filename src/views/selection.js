// ---------------------------------------------
//  Selection
// ---------------------------------------------
//  The selection view. Doesn't actually have a
//  DOM element - just contains all the logic
//  for translating the selection model to/from
//  the browser.
// ---------------------------------------------

MediumEditor.SelectionView = MediumEditor.View.extend({

  // ---------------------------------------------
  //  Constructor
  // ---------------------------------------------

  init: function(attrs) {
    this._super(attrs);

    // Should be passed the document view
    this._documentView = attrs['documentView'];
    this._documentModel = this._documentView.model();

    // Listen for any events which may modify the
    // selection. Note, we listen to the document
    // element because there may be keyup events
    // in the highlight menu which are irrelevant.
    this.on('keyup', this._documentView._el, this._onKeyUp.bind(this));
    this.on('mouseup', document, this._onMouseUp.bind(this));           // Listen to document in case the editor loses focus

    // Listen for new blocks being added and give
    // them focus
    this.on('add', this._documentModel.children(), this._onBlockAdded.bind(this));

    // Listen for changes to the model and
    // reflect them in the browser
    this.on('changed', this._model, this._onSelectionChanged.bind(this));
  },

  // ---------------------------------------------
  //  Event Handlers
  // ---------------------------------------------

  _onKeyUp: function(e) {
    this._determineFromBrowser();
  },

  _onMouseUp: function(e) {
    this._determineFromBrowser();
  },

  // Whenever a new block is added, give it focus
  _onBlockAdded: function(block, ix) {
    this._model.set({
      startIx:      ix,
      startOffset:  0
    });
  },

  _onSelectionChanged: function(selection, caller) {
    if (caller != this) this._setOnBrowser();
  },

  // ---------------------------------------------
  //  Accessors
  // ---------------------------------------------

  rectangle: function() {
    return this._rectangle;
  },

  startEl: function() {
    return this._documentView._el.childNodes[this._model._startIx];
  },

  // ---------------------------------------------
  //  Utility Methods
  // ---------------------------------------------

  // Query the browser regarding the state of the
  // selection and update the selection model
  _determineFromBrowser: function() {

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
      this._model.null();
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

    // Grab the rectangle and convert it to
    // document space
    var selectionRect = range.getBoundingClientRect();
    var documentRect = this._documentView._el.getBoundingClientRect();
    var top = selectionRect.top - documentRect.top; var bottom = selectionRect.bottom - documentRect.top;
    var left = selectionRect.left - documentRect.left; var right = selectionRect.right - documentRect.left;
    this._rectangle = {
      top:      top,
      left:     left,
      bottom:   bottom,
      right:    right
    };

    // Update the model
    this._model.set({
      startIx:      startIx,
      startOffset:  startOffset,
      endIx:        endIx,
      endOffset:    endOffset
    }, this);
  },

  // Set the selection in the browser
  _setOnBrowser: function() {
    if (document.createRange && window.getSelection) {

      // Normal browsers
      var range = document.createRange();
      var sel = window.getSelection();
      var mapping = this._translateToNodeSpace(this._model._startIx, this._model._startOffset);
      range.setStart(mapping.node, mapping.offset);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);

    } else if (document.selection && document.body.createTextRange) {

      // IE8
      var textRange = document.body.createTextRange();
      textRange.moveToElementText(this._documentView._el.childNodes[this._model._startIx]);
      textRange.collapse(true);
      textRange.moveEnd("character", this._model._startOffset);
      textRange.moveStart("character", this._model._startOffset);
      textRange.select();
    }
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
    var el = this._documentView._el.childNodes[ix];
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
    if (this._documentView._el == el) {
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
    while (node.parentNode != this._documentView._el) {
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
