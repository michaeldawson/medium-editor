// ---------------------------------------------
//  Editor
// ---------------------------------------------
//  Contains the actual editable document,
//  along with the highlight menu and inline
//  tooltip.
// ---------------------------------------------

MediumEditor.EditorView = MediumEditor.View.extend({

  // ---------------------------------------------
  //  Constructor
  // ---------------------------------------------

  init: function(attrs) {
    this._super(attrs);

    // Create the editor view element
    this._el = document.createElement('div');
    this._el.className = 'medium-editor';

    // Add a document view as a child
    this._documentView = new MediumEditor.DocumentView({ model: this._model });
    this._el.appendChild(this._documentView._el);

    // Create the selection. Some of the views need
    // this to subscribe to change events.
    this._selection = new MediumEditor.SelectionView({ model: new MediumEditor.SelectionModel({}), documentView: this._documentView });

    // Create the highlight menu
    this._highlightMenuView = new MediumEditor.HighlightMenuView({ model: this._model, selection: this._selection });
    this._el.appendChild(this._highlightMenuView._el);

    // Create the inline tooltip
    this._inlineTooltipView = new MediumEditor.InlineTooltipView({ model: this._model, selection: this._selection });
    this._el.appendChild(this._inlineTooltipView._el);

    // Listen for key events which we may want to
    // capture and handle differently and/or cancel
    // (such as enter).
    this.on('keydown', this._documentView._el, this._onKeyDown.bind(this));

    // Listen for key events which may have
    // modified the content and flush the changes
    // through the model.
    this.on('keyup', this._documentView._el, this._onKeyUp.bind(this));
  },

  // ---------------------------------------------
  //  Event Handlers
  // ---------------------------------------------

  // Intercept key events which may modify the
  // block structure, such as enter or backspace.
  _onKeyDown: function(e) {
    switch (e.which) {

      case 77:
        if (!e.ctrlKey) break;
      case 13:

        // Enter / Ctrl + m. If the user is hold shift
        // down, we consider this a line break and
        // don't handle it.
        if (e.shiftKey) return;

        // Shift key isn't being pressed. Insert a new
        // paragraph at the current selection.
        this._model.insertParagraph(this._selection.model());

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

    // After edits, flush the changes through the
    // model change pipeline.
    // TODO - not interested in the events covered in keydown, like enter etc
    // if (e.which == 13) return; - what about if shift is held down?

    var text = this._selection.startEl().innerText;

    if (text.match(/^1\.\s/)) {
      this._model.changeBlockType('ORDERED_LIST_ITEM', this._selection.model());
    } else if (text.match(/^\*\s/)) {
      this._model.changeBlockType('UNORDERED_LIST_ITEM', this._selection.model());
    } else {

      if (text == "\n") text = '';     // Empty paragraphs
      this._model.setText(text, this._selection.model());

      // TODO: we need to determine the block(s) involved
      // (if any), map the DOM back to a model representation,
      // then push those changes to the model.
      // pretty similar to the process for parsing pasted
      // text/html.
    }
  }
});
