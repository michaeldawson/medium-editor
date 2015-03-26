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
  },

  // Listen for normal editing changes. Let them
  // complete, then flush them through the model
  // change pipeline. Note, we don't use keypress
  // here, even though it handles things like
  // holding down the button nicely, because we
  // also want to deal with backspace and other
  // keys not captured by keypress.
  _onKeyUp: function(e) {

    // Update the selection
    this._selection.determineFromBrowser();

    // Ignore system keys
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
        return;
    }

    var selectionModel = this._selection.model();
    var text = this._selection.startBlockElement().innerText;

    if (text.match(/^1\.\s/)) {
      this._model.changeBlockType('ORDERED_LIST_ITEM', { text: text.substring(3) }, selectionModel);
    } else if (text.match(/^\*\s/)) {
      this._model.changeBlockType('UNORDERED_LIST_ITEM', { text: text.substring(2) }, selectionModel);
    } else {
      this._model.setText(text, selectionModel);
    }
  },

  // Intercept key events which may modify the
  // block structure, such as enter or backspace.
  _onKeyDown: function(e) {
    switch (e.which) {

      case 77:                    // m - if the ctrl key is being keld, it will fall through
        if (!e.ctrlKey) break;
      case 13:

        // Enter / Ctrl + m. If the user is holding
        // shift down, we consider this a line
        // break and don't handle it.
        if (e.shiftKey) return;

        // Shift key isn't being pressed. If we're
        // on a blank list item, convert it to a
        // paragraph.
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
            startIx:      selectionModel._startIx + 1,
            startOffset:  0
          });
        }

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

  _onMouseUp: function(e) {
    this._selection.determineFromBrowser();
  },

  selection: function() {
    return this._selection;
  },

  document: function() {
    return this._document;
  }

});
