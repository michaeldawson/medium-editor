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

    switch (e.which) {

      case 77:                    // m - if the ctrl key is being held, it will fall through
        if (!e.ctrlKey) break;
      case 13:

        // Enter / Ctrl + m
        var selectionModel = this._selection.model();
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
        // handled by contenteditable, unless it's
        // one of these scenarios:
        //
        //  Selected block is media - convert it to a paragraph
        //  We're at offset zero:
        //    Selected block is first in document - do nothing
        //    Selected block is a list item - convert it to a paragraph
        //    Prev block is a divider - kill the divider
        //    Prev block is media - select it
        //    Otherwise, merge the text of this block up into the previous

        var selectionModel = this._selection.model();
        var selectedBlock = selectionModel.startBlock();

        if (selectedBlock.isMedia() || selectionModel._startOffset == 0) {

          // From here on, once we're done, we're
          // going to prevent the default action.

          if (selectedBlock.isMedia() || selectedBlock.isListItem()) {

            // It's a media item, or we're at
            // offset 0 of a list item. Change it
            // to a paragraph
            this._model.changeBlockType('PARAGRAPH', {}, selectionModel);
            selectionModel.set({
              ix:      selectionModel._startIx,
              offset:  0,
            });

          } else if (selectionModel._startIx == 0) {

            // First block in the document - do
            // nothing

          } else {

            // We're at offset zero of a non-list,
            // non-media item which is not the
            // first block in the document.
            // Depending on the previous block
            // type ...
            var prevBlock = this._model.blocks().at(selectionModel._startIx - 1);
            if (prevBlock.isDivider()) {

              // It's a divider - remove it
              this._model.removeBlockAt(selectionModel._startIx - 1);
              selectionModel.set({
                ix:      selectionModel._startIx - 1,
                offset:  0,
              });

            } else if (prevBlock.isMedia()) {

              // It's media. Select it.
              selectionModel.set({
                ix:      selectionModel._startIx - 1,
              });

            } else {

              // Previous block is neither a
              // divider or media, so merge the
              // text of this block up into the
              // previous and destroy this block.
              var prevBlockText = prevBlock.text();
              var newText = prevBlockText + selectedBlock.text();
              this._model.setText(newText, prevBlock);
              this._model.removeBlockAt(selectionModel._startIx);
              selectionModel.set({
                ix:       selectionModel._startIx - 1,
                offset:   prevBlockText.length
              });
            }

          }

          e.preventDefault();
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
