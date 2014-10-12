// ---------------------------------------------
//  Editor
// ---------------------------------------------
//  Contains the actual editable document,
//  along with the highlight menu and inline
//  tooltip. Also responsible for managing the
//  current selection.
// ---------------------------------------------

MediumEditor.EditorView = MediumEditor.View.extend({
  init: function(attrs) {
    this._super(attrs);

    // Create the editor view element
    this.el = document.createElement('div');
    this.el.className = 'medium-editor';

    // Create the selection model. Some of the
    // views need this to subscribe to change
    // events.
    this.selection = new MediumEditor.SelectionModel({ document: this.model });

    // Add a document view as a child
    this.documentView = new MediumEditor.DocumentView({ model: this.model });
    this.el.appendChild(this.documentView.el);

    // Create the highlight menu
    this.highlightMenuView = new MediumEditor.HighlightMenuView({ model: this.model, selection: this.selection, editorEl: this.el });
    this.el.appendChild(this.highlightMenuView.el);

    // Create the inline tooltip
    this.inlineTooltipView = new MediumEditor.InlineTooltipView({ model: this.model, selection: this.selection });
    this.el.appendChild(this.inlineTooltipView.el);

    // Listen for any events which may modify the
    // selection. This view is ultimately responsible
    // for the selection object, including triggering
    // events for other views to listen to and
    // ensuring the selection is valid (e.g.
    // preventing selection on a divider).
    //
    // Note, we listen to the document view element
    // because there may be keydown events in the
    // inline tooltip which are irrelevant.
    this.on('keydown', this.documentView.el, this._onKeyDown.bind(this));
    this.on('keyup', this.documentView.el, this._onKeyUp.bind(this));
    this.on('mouseup', document, this._onMouseUp.bind(this));     // Listen to document in case the editor loses focus
  },

  _onKeyDown: function(e) {
    switch (e.which) {
      case 37:    // Left arrow

        // TODO - if selection is at the beginning of a block
        // and there's a block above and it's a divider, cancel
        // and skip straight up to the block above that (if
        // there is one).
        // If the block above is an image or video, give it
        // focus.

        break;
      case 38:    // Up arrow
      case 39:    // Right arrow
      case 40:    // Down arrow
        break;
    }
  },

  _onKeyUp: function(e) {
    this._refreshSelection();
  },

  _onMouseUp: function(e) {
    this._refreshSelection();
  },

  // Query the browser regarding the state of the
  // selection, and use that info to update the
  // selection model.
  _refreshSelection: function() {

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
      startNode = endInfo.node;
      startOffset = endInfo.offset;
    }

    // Is the selection outside the document?
    if (!this._isWithinDocument(startNode)) {
      this.selection.null();
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

    // Grab the rectangle
    var rectangle = range.getBoundingClientRect();

    // Update the selection
    this.selection.update({
      startIx:      startIx,
      startOffset:  startOffset,
      endIx:        endIx,
      endOffset:    endOffset,
      rectangle:    rectangle
    });
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
    if (this.documentView.el == el) {
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
    while (node.parentNode != this.documentView.el) {
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
