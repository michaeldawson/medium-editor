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
  // offsets corresponding to character indices),
  // so they'll need to be translated from node
  // space first.
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
