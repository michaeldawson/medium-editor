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
    var html = this._selection.startBlockElement().innerHTML.trim();
    if (html == "<br>") html = "";

    if (block.isParagraph() && html.match(/^1\.\s/)) {

      // Paragraphs starting with '1. ' - convert
      // to a list item
      block.setType('ORDERED_LIST_ITEM', { text: html.substring(3) });
      this._selectionModel.caret(this._selectionModel.startIx(), 0, { triggerEvent: false });

    } else if (block.isParagraph() && html.match(/^\*\s/)) {

      // Paragraphs starting with '* ' - convert
      // to a list item
      block.setType('UNORDERED_LIST_ITEM', { text: html.substring(2) });
      this._selectionModel.caret(this._selectionModel.startIx(), 0, { triggerEvent: false });

    } else {

      // Otherwise just flush through
      block.setHTML(html);
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
            this._selectionModel.caret(this._selectionModel.startIx() - 1, prevBlockText.length);
            prevBlock.setText(newText);
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
