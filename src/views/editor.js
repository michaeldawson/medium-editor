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
    var selectionModel = new MediumEditor.SelectionModel({ document: this._model });
    this._selection = new MediumEditor.SelectionView({ model: selectionModel, editor: this });

    // Add a document view as a child
    this._document = new MediumEditor.DocumentView({ model: this._model, editor: this });
    this._el.appendChild(this._document._el);

    // Add the inline tooltip menu
    this._inlineTooltip = new MediumEditor.InlineTooltipMenuView({ model: this._model, editor: this });
    this._el.appendChild(this._inlineTooltip._el);

    // Add the highlight menu
    this._highlightMenu = new MediumEditor.HighlightMenuView({ model: this._model, editor: this });
    this._el.appendChild(this._highlightMenu._el);

    // Add event handlers. We centralise event
    // handling here then delegate out to the
    // document view, selection, inline tooltip and
    // hover menu because the order of those
    // handlers is important.
    this.on('keyup', this._document._el, this._onKeyUp.bind(this));
    this.on('keydown', this._document._el, this._onKeyDown.bind(this));
    this.on('mouseup', document, this._onMouseUp.bind(this));
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

    // Flush the changes through
    // the pipeline and handle special cases like
    // lists and captions.
    var selectionModel = this._selection.model();
    var selectionModelBlock = selectionModel.startBlock();
    var text = this._selection.startBlockElement().innerText;
    if (text == "\n") text = "";
    if (selectionModelBlock.isParagraph() && text.match(/^1\.\s/)) {
      this._model.changeBlockType('ORDERED_LIST_ITEM', { text: text.substring(3) }, selectionModel);
      selectionModel.set({
        ix: selectionModel._startIx,     // The offset has now changed because we stripped out "1. "
        offset: 0
      }, { triggerEvent: false });
    } else if (selectionModelBlock.isParagraph() && text.match(/^\*\s/)) {
      this._model.changeBlockType('UNORDERED_LIST_ITEM', { text: text.substring(2) }, selectionModel);
      selectionModel.set({
        ix: selectionModel._startIx,     // The offset has now changed because we stripped out "* "
        offset: 0
      }, { triggerEvent: false });
    } else {
      this._model.setText(text, selectionModelBlock);
    }

    // Now trigger the selection event - the model
    // is up to date.
    selectionModel.trigger('changed', selectionModel, this._selection);
  },

  // Intercept key events which may modify the
  // block structure, such as enter or backspace.
  _onKeyDown: function(e) {

    // If selection is a range spanning multiple
    // blocks, kill everything in the range (unless
    // the key is something innocuous like an arrow
    // or shift)
    var selectionModel = this._selection.model();
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
    if (selectionModel.isRange() &&
        selectionModel._startIx != selectionModel._endIx &&
        systemKeys.indexOf(e.which) < 0) {

      var startBlock = selectionModel.startBlock();
      var endBlock = selectionModel.endBlock();
      var newStartBlockText = startBlock.text().substr(0, selectionModel._startOffset);
      newStartBlockText += endBlock.text().substr(selectionModel._endOffset);
      this._model.setText(newStartBlockText, startBlock);

      for(var i = selectionModel._endIx; i > selectionModel._startIx; i--) {
        this._model.removeBlockAt(i);
      }

      if (e.which == 8) e.preventDefault();   // Don't double-backspace
    }

    switch (e.which) {

      case 77:                    // m - if the ctrl key is being held, it will fall through
        if (!e.ctrlKey) break;
      case 13:

        // Enter / Ctrl + m
        var selectedBlock = selectionModel.startBlock();

        if (selectionModel.isCaret() &&
            selectedBlock.isListItem() &&
            selectedBlock.isEmpty()) {

          // If we're on a blank list item,
          // convert it to a paragraph
          this._model.changeBlockType('PARAGRAPH', {}, selectionModel);

        } else {

          // Not on a blank list item. Insert a new
          // block at the current selection.
          // General strategy is we split the block,
          // inserting another of the same type
          // above the current block, unless
          // selection is on an image (we create a
          // paragraph underneath) or at offset 0
          // of a header (the new block is a
          // paragraph).

          if (selectedBlock.isMedia()) {

            // Media item selected - insert a
            // paragraph below
            this._model.insertBlockAt('PARAGRAPH', selectionModel._startIx + 1);

          } else {

            var text = selectedBlock.text();
            var textBeforeCaret = text.substring(0, selectionModel._startOffset);
            var textAfterCaret = text.substring(selectionModel._startOffset);
            var newType = textBeforeCaret == '' && selectedBlock.isHeading() ? 'PARAGRAPH' : selectedBlock.type();

            this._model.insertBlockAt(newType, selectionModel._startIx, { text: textBeforeCaret });
            this._model.setText(textAfterCaret, selectedBlock);
          }

          // Put focus on the new child paragraph
          selectionModel.set({
            ix:      selectionModel._startIx + 1,
            offset:  0
          });
        }

        e.preventDefault();
        break;

      case 8:

        // Backspace. Generally want this to be
        // handled by contenteditable, unless it
        // will modify the block structure.

        if (selectionModel.isCaret()) {
          var selectedBlock = selectionModel.startBlock();
          var prevBlock = selectionModel._startIx == 0 ? null : this._model.blocks().at(selectionModel._startIx - 1);
          if (selectedBlock.isMedia()) {

            // Media selection. Change it to a
            // paragraph.
            this._model.changeBlockType('PARAGRAPH', {}, selectionModel);
            selectionModel.set({
              ix:      selectionModel._startIx,   // TODO - we could get rid of this if we defaulted startOffset on media selects
              offset:  0,
            });
            e.preventDefault();

          } else if (selectedBlock.isListItem() && selectionModel._startOffset == 0) {

            // List item and selection is at offset
            // zero. Change it to a paragraph.
            this._model.changeBlockType('PARAGRAPH', {}, selectionModel);
            e.preventDefault();

          } else if (selectionModel._startIx == 0 && selectionModel._startOffset == 0) {

            // At offset zero in the first block of
            // the document - do nothing.
            e.preventDefault();

          } else if (selectionModel._startOffset == 0 && prevBlock.isDivider()) {

            // At offset zero and previous block is
            // a divider. Kill it.
            this._model.removeBlockAt(selectionModel._startIx - 1);
            selectionModel.set({
              ix:      selectionModel._startIx - 1,
              offset:  0,
            });
            e.preventDefault();

          } else if (selectionModel._startOffset == 0 && prevBlock.isMedia()) {

            // Previous block is media. Select it.
            selectionModel.set({
              ix:      selectionModel._startIx - 1,
            });
            e.preventDefault();

          } else if (selectionModel._startOffset == 0) {

            // Any other scenario where we're at
            // offset zero - merge the block upward
            // into the previous.
            var prevBlockText = prevBlock.text();
            var newText = prevBlockText + selectedBlock.text();
            this._model.setText(newText, prevBlock);
            selectionModel.set({
              ix:       selectionModel._startIx - 1,
              offset:   prevBlockText.length
            });
            this._model.removeBlockAt(selectionModel._startIx + 1);
            e.preventDefault();
          }
        }
        break;
    }
  },

  _onMouseUp: function(e) {
    this._selection.determineFromBrowser();
  },

  _onMouseDown: function(e) {

    // Did the user click on an image/video? If so,
    // set selection on it.
    if (e.target.tagName.toLowerCase() == 'img' &&
        e.target.parentNode.tagName.toLowerCase() == 'figure') {
      var element = e.target.parentNode;
      var ix = this._selection._getIndexFromBlockElement(element);
      this._selection.model().set({ startIx: ix });
    }
  },

  selection: function() {
    return this._selection;
  },

  document: function() {
    return this._document;
  }

});
