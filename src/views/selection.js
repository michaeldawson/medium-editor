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
    return MediumEditor.ModelDOMMapper.getBlockElementFromIndex(this._document()._el, this._model._startIx);
  },

  endBlockElement: function() {
    return MediumEditor.ModelDOMMapper.getBlockElementFromIndex(this._document()._el, this._model._endIx);
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
      this._selectedMediaEl = MediumEditor.ModelDOMMapper.getBlockElementFromIndex(this._document()._el, this._model._startIx);
      this._selectedMediaEl.className = 'medium-editor-media-selected';
      this.deselect();
      this._updateRectangle(this._selectedMediaEl);

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

      // Check if media is selected
      if (this._selectedMediaEl) {

        // Yep. Update the model.
        var ix = MediumEditor.ModelDOMMapper.getIndexFromBlockElement(this._selectedMediaEl);
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
    var startPosition = MediumEditor.ModelDOMMapper.domSpaceToModelSpace(startNode, startOffset, range, true);
    var endPosition = MediumEditor.ModelDOMMapper.domSpaceToModelSpace(endNode, endOffset, range, false);

    // Special case - paragraph selecting.
    if (endPosition.ix == startPosition.ix + 1 && endPosition.offset == 0) {
      endPosition.ix = startPosition.ix;
      endPosition.offset = this._editor._model.blocks().at(startPosition.ix).text().length;
    }

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
