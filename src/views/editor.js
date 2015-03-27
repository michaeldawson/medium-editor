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
    var selectionModel = this._selection.model();

    // For system keys, we don't need to flush any
    // changes through the model pipeline, so just
    // trigger the selection event and return.
    switch(e.which) {
      case 9:           // Tab
      case 13:          // Enter
      case 16:          // Shift
      case 17:          // Ctrl
      case 18:          // Alt
      case 19:          // Pause/break
      case 20:          // Caps lock
      case 27:          // Escape
      case 33:          // Page up
      case 34:          // Page down
      case 35:          // End
      case 36:          // Home
      case 37:          // Left arrow
      case 38:          // Up arrow
      case 39:          // Right arrow
      case 40:          // Down arrow
      case 45:          // Insert
      case 46:          // Delete
      case 91:          // Left window key
      case 92:          // Right window key
      case 93:          // Select key
        selectionModel.trigger('changed', selectionModel, this._selection);
        return;
    }

    // Non-system keys. Flush the changes through
    // the pipeline and handle special cases like
    // lists and captions.
    if (selectionModel.startBlock().isMedia()) {

      // console.log(this._selection.startBlockElement().innerText);
      //
      // could probably just do set text
      // obviously dont do the 1. and * thing though
    }

    var text = this._selection.startBlockElement().innerText;
    if (text.match(/^1\.\s/)) {
      this._model.changeBlockType('ORDERED_LIST_ITEM', { text: text.substring(3) }, selectionModel);
    } else if (text.match(/^\*\s/)) {
      this._model.changeBlockType('UNORDERED_LIST_ITEM', { text: text.substring(2) }, selectionModel);
    } else {
      this._model.setText(text, selectionModel.startBlock());
    }

    // Now trigger the selection event - the model
    // is up to date.
    selectionModel.trigger('changed', selectionModel, this._selection);
  },

  // Intercept key events which may modify the
  // block structure, such as enter or backspace.
  _onKeyDown: function(e) {

    // Is it a range? If so, unless it's one of a
    // specific set of keys, it's going to destroy
    // that range.

    var selectionModel = this._selection.model();
    if (selectionModel.isRange()) {

      // Ignore these keys
      if (e.metaKey) return;
      switch(e.which) {
        case 9:           // Tab
        case 16:          // Shift
        case 17:          // Ctrl
        case 18:          // Alt
        case 19:          // Pause/break
        case 20:          // Caps lock
        case 27:          // Escape
        case 33:          // Page up
        case 34:          // Page down
        case 35:          // End
        case 36:          // Home
        case 37:          // Left arrow
        case 38:          // Up arrow
        case 39:          // Right arrow
        case 40:          // Down arrow
        case 91:          // Left window key
        case 92:          // Right window key
        case 93:          // Select key
          return;
      }

      // Okay, it's a range and it's not one of the
      // system keys, so kill the range
      if (selectionModel.withinOneBlock()) {

        // Selection is within a single block
        var block = selectionModel.startBlock();
        var text = block.text();
        var newText = text.substring(0, selectionModel._startOffset) + text.substring(selectionModel._endOffset);
        this._model.setText(newText, block);

      } else {

        // Selection spans multiple blocks
        var startBlock = selectionModel.startBlock();
        var endBlock = selectionModel.endBlock();
        var newStartBlockText = startBlock.text().substring(0, selectionModel._startOffset) +
          endBlock.text().substring(selectionModel._endOffset);
        for(var i = selectionModel._endIx; i > selectionModel._startIx; i--) {
          this._model.removeBlockAt(i);
        }
        this._model.setText(newStartBlockText, startBlock);
      }

    } else {

      // Caret selection.
      switch (e.which) {

        case 77:                    // m - if the ctrl key is being held, it will fall through
          if (!e.ctrlKey) break;
        case 13:

          // Enter / Ctrl + m. If the user is
          // holding shift down, we consider this a
          // line break and don't handle it.
          if (e.shiftKey) return;

          // Shift key isn't being pressed. If
          // we're on a blank list item, convert it
          // to a paragraph.
          var selectionModel = this._selection.model();
          var selectedBlock = selectionModel.startBlock();
          if (selectionModel.isCaret() &&
              selectedBlock.isListItem() &&
              selectedBlock.isEmpty()) {
              this._model.changeBlockType('PARAGRAPH', {}, selectionModel);
              this._selection.setOnBrowser();
          } else {

            // Not a caret on a blank list item.
            // Insert a new block at the current
            // selection.
            this._model.insertBlock(selectionModel);
            selectionModel.set({
              ix:      selectionModel._startIx + 1,
              offset:  0
            });
          }

          e.preventDefault();
          break;

        case 8:

          // Backspace
          var selectionModel = this._selection.model();
          var block = selectionModel.startBlock();
          if (selectionModel._startOffset == 0 || block.isMedia()) {

            if (block.isListItem()) {

              // Is this is a list item, change it
              // to a paragraph
              this._model.changeBlockType('PARAGRAPH', {}, selectionModel);

            } else if (block.isMedia()) {

              // TODO - kill it and handle cursor

            } else if (selectionModel._startIx == 0) {

              // First block in the document. Do
              // nothing.

            } else {

              // Not the first block, not a list
              // item and not media. Merge it
              // backward into the previous block
              // and update the selection.
              var prevBlock = this._model.blocks().at(selectionModel._startIx - 1);
              var endOffset = prevBlock.text().length;
              this._model.setText(prevBlock.text() + block.text(), prevBlock);
              this._model.removeBlockAt(selectionModel._startIx);
              selectionModel.set({
                ix:      selectionModel._startIx - 1,
                offset:  endOffset
              });

              // TODO - what if the prev block is a divider?

            }
            e.preventDefault();
          }

          break;

        case 46:

          // Delete
          // TODO

          break;

          // need to also consider paste
      }

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
