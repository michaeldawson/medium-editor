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
    this.highlightMenuView = new MediumEditor.HighlightMenuView({ model: this.model, editorView: this });
    this.el.appendChild(this.highlightMenuView.el);

    // Create the inline tooltip
    this.inlineTooltipView = new MediumEditor.InlineTooltipView({ model: this.model, editorView: this });
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

    // Listen for new blocks being added and give
    // them focus
    this.on('add', this.model.children, this._onBlockAdded.bind(this));
  },

  _onBlockAdded: function(block, ix) {
    this._setSelection(ix, 0);
  },

  _onKeyDown: function(e) {
    switch (e.which) {
      case 37:    // Left arrow
      case 38:    // Up arrow
      case 39:    // Right arrow
      case 40:    // Down arrow

        // If an arrow key would put the selection on a
        // divider, cancel it and try to move it to the
        // next appropriate selectable block instead.

        var direction = e.which <= 38 ? -1 : 1;     // +1 for down, -1 for up

        // Ignore if we're going left and not at offset
        // 0, or going right and not at the end of the
        // block.
        if (e.which == 37 && this.selection.startOffset > 0) return;
        if (e.which == 39 && this.selection.endOffset < this.selection.endBlock.text.length) return;

        // Ignore if we're going up but we're already
        // on the first block, or going down and we're
        // already on the last block.
        if (direction < 0 && this.selection.startIx == 0) return;
        if (direction > 0 && this.selection.endIx == this.model.children.size() - 1) return;

        // Determine the block we're attempting to move
        // to.
        var ix = (direction < 0 ? this.selection.startIx : this.selection.endIx) + direction;
        var targetBlock = this.model.children.at(ix);

        // Is it a divider?
        if (targetBlock.type == 'divider') {

          // Prevent the action
          e.preventDefault();

          // Try to find a selectable block instead
          var newIx = (direction < 0 ? this._findPrevSelectableBlock(ix, true) : this._findNextSelectableBlock(ix, true));
          this._setSelection(newIx, e.which == 37 ? this.model.children.at(newIx).text.length : 0);
        }

        break;

      case 77:
        if (!e.ctrlKey) break;
      case 13:

        // Enter / Ctrl + m
        var sel = this.selection;

        if (sel.type == 'caret' && (
              sel.startBlock.type == 'ordered_list' ||
              sel.startBlock.type == 'unordered_list'
           )) {

           var listItemsText = this._selectedBlockText().substr(0, sel.startOffset).split("\n");
           var last = listItemsText[listItemsText.length - 1];
           if (last != "") {
             return;
           }
        }

        this.model.insertParagraph(this.selection);

        e.preventDefault();
        break;

      case 8:

        // Backspace
        // TODO - if we're at offset zero
        // if we're on an image, kill it - and put the cursor where?
        // Don't allow backspacing at the start of the doc - kills the p and replaces it with a div

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
  },

  // Listen for normal editing changes. Let
  // them complete, then flush them through the
  // model change pipeline. Note, we don't use
  // keypress here, even though it handles
  // things like holding down the button nicely,
  // because we also want to deal with backspace
  // and other keys not captured by keypress.
  _onKeyUp: function(e) {
    this._refreshSelection();

    // After edits, flush the changes through the
    // model change pipeline.
    // TODO - not interested in the events covered in keydown, like enter etc
    if (e.which == 13) return;

    var text = this._selectedBlockText();

    if (text.match(/^1\.\s/)) {
      this.model.changeBlockType(this.selection, 'ordered_list');
      this._setSelection(this.selection.startIx, 0);
    } else if (text.match(/^\*\s/)) {
      this.model.changeBlockType(this.selection, 'unordered_list');
      this._setSelection(this.selection.startIx, 0);
    } else {

      if (text == "\n") text = '';     // Empty paragraphs
      this.selection.startBlock.setText(text);

      // TODO: we need to determine the block(s) involved
      // (if any), map the DOM back to a model representation,
      // then push those changes to the model.
      // pretty similar to the process for parsing pasted
      // text/html.
    }
  },

  _onMouseUp: function(e) {
    this._refreshSelection();
  },

  _selectedBlockText: function() {
    return this.documentView.el.childNodes[this.selection.startIx].innerText;
  },

  _setSelection: function(ix, offset) {

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
      textRange.moveToElementText(this.documentView.el.childNodes[ix]);
      textRange.collapse(true);
      textRange.moveEnd("character", offset);
      textRange.moveStart("character", offset);
      textRange.select();
    }
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
      endNode = endInfo.node;
      endOffset = endInfo.offset;
    }

    // Is the selection outside the document?
    if (!this._isWithinDocument(startNode)) {
      this.selection.null();
      return;
    }

    // The selection/cursor is within the document
    // element itself, instead of one of the
    // blocks. Usually means they've clicked on
    // an unselectable element, like a HR. Use the
    // offset to determine a more appropriate
    // selection position.
    if (startNode == this.documentView.el) {
      var newIx = this._findNextSelectableBlock(startOffset, true);
      this._setSelection(newIx, 0);
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

  _findNextSelectableBlock: function(ix, tryPrev) {
    for(var i = ix; i < this.model.children.size(); i++) {
      var block = this.model.children.at(i);
      if (!(block.type == 'divider')) return i;
    }
    return tryPrev ? this._findPrevSelectableBlock(ix, false) : null;
  },

  _findPrevSelectableBlock: function(ix, tryNext) {
    for(var i = ix; i >= 0; i--) {
      var block = this.model.children.at(i);
      if (!(block.type == 'divider')) return i;
    }
    return tryNext ? this._findNextSelectableBlock(ix, false) : null;
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
  // Adapted from http://stackoverflow.com/a/4770562/889232
  // Note we used to use the range objects to
  // measure the text directly, as per http://stackoverflow.com/a/4812022/889232,
  // however that didn't allow us to account for
  // lists.
  _measureTextOffset: function(offset, node, element, range, start) {

    var treeWalker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      function(node) {
        var nodeRange = document.createRange();
        nodeRange.selectNode(node);
        var beforeRange = nodeRange.compareBoundaryPoints(Range.END_TO_END, range) < 1;
        var isLiOrTextNode = node.nodeType == 3 || (node.nodeType == 1 && node.tagName.toLowerCase() == 'li');
        return beforeRange && isLiOrTextNode ?
            NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
      false
    );

    var charCount = 0;
    while (treeWalker.nextNode()) {
      var len = treeWalker.currentNode.nodeType == 3 ? treeWalker.currentNode.length : 1;
      charCount += len;
    }
    if (range.startContainer.nodeType == 3) {
      charCount += range.startOffset;
    }
    return charCount;
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
