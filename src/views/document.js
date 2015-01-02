// ------------------------------------------------
//  Document
// ------------------------------------------------
//  The document view.
// ------------------------------------------------

MediumEditor.DocumentView = MediumEditor.View.extend({

  // ----------------------------------------------
  //  Constructor
  // ----------------------------------------------

  init: function(attrs) {
    this._super(attrs);

    // Create the document view element
    this._el = document.createElement('div');
    this._el.className = 'medium-editor-document';
    this._el.contentEditable = true;

    // Create the selection model and view
    this._selection = new MediumEditor.SelectionView({ model: new MediumEditor.SelectionModel({}), documentView: this });

    // Listen for changes to the document model
    this.on('changed', this._model, this._onChanged.bind(this));

    // Listen for key events which we may want to
    // capture and handle differently and/or cancel
    // (such as enter).
    this.on('keydown', this._el, this._onKeyDown.bind(this));

    // Listen for key events which may have
    // modified the content and flush the changes
    // through the model.
    this.on('keyup', this._el, this._onKeyUp.bind(this));

    // Perform an initial render
    this._render();
  },

  // ----------------------------------------------
  //  Event Handlers
  // ----------------------------------------------

  _onChanged: function() {
    this._render();
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

        // Shift key isn't being pressed. Insert a
        // new paragraph at the current selection.
        var selectionModel = this._selection.model();
        this._model.insertParagraph(selectionModel);
        this._selection.model().set({
          startIx:      selectionModel._startIx + 1,
          startOffset:  0
        });

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

  // Listen for normal editing changes. Let them
  // complete, then flush them through the model
  // change pipeline. Note, we don't use keypress
  // here, even though it handles things like
  // holding down the button nicely, because we
  // also want to deal with backspace and other
  // keys not captured by keypress.
  _onKeyUp: function(e) {

    // Ignore system keys
    switch(e.which) {
      case 8:           // Backspace
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
      this._model.changeBlockType('ORDERED_LIST_ITEM', selectionModel);
      this._selection.model().set({
        startIx:      selectionModel._startIx,
        startOffset:  0
      });
    } else if (text.match(/^\*\s/)) {
      this._model.changeBlockType('UNORDERED_LIST_ITEM', selectionModel);
      this._selection.model().set({
        startIx:      selectionModel._startIx,
        startOffset:  0
      });
    } else {
      this._model.setText(text, selectionModel);
    }
  },

  // ----------------------------------------------
  //  Utility Methods
  // ----------------------------------------------

  _render: function() {
    this._selection.restoreAfter((function() {
      this._el.innerHTML = MediumEditor.ModelDOMMapper.toHTML(this._model);
    }).bind(this));
  },

});
