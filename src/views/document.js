// ---------------------------------------------
//  Document
// ---------------------------------------------

MediumEditor.DocumentView = MediumEditor.View.extend({
  init: function(attrs) {
    this._super(attrs);
    this.selection = attrs['selection'];

    // Create the document view element
    this.el = document.createElement('div');
    this.el.className = 'medium-editor-document';
    this.el.contentEditable = true;

    // Add views for each existing block and
    // begin listening for any new blocks being
    // added
    this.model.children.on('add', this._onBlockAdded.bind(this));
    for(var i = 0; i < this.model.children.size(); i++) {
      var block = this.model.children.at(i);
      this._addBlock(block);
    }

    // Listen for events we might want to capture
    // and cancel, like enter, backspace etc.
    this.on('keydown', this.el, this._onKeyDown.bind(this));

    // Listen for normal editing changes. Let
    // them complete, then flush them through the
    // model change pipeline. Note, we don't use
    // keypress here, even though it handles
    // things like holding down the button nicely,
    // because we also want to deal with backspace
    // and other keys not captured by keypress.
    this.on('keyup', this.el, this._onKeyUp.bind(this));
  },

  _onBlockAdded: function(blockModel, ix) {
    this._addBlock(blockModel, ix);
  },

  _addBlock: function(blockModel, ix) {
    var blockView = new MediumEditor.BlockView({ model: blockModel });
    if (ix === undefined || ix >= this.el.childNodes.length) {
      this.el.appendChild(blockView.el);
    } else {
      this.el.insertBefore(blockView.el, this.el.childNodes[ix]);
    }
  },

  // Capture and prevent certain key events
  _onKeyDown: function(e) {
    switch(e.which) {

      case 77:
        if (!e.ctrlKey) break;
      case 13:

        // Enter / Ctrl + m
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

  // After edits, flush the changes through the
  // model change pipeline.
  _onKeyUp: function(e) {

    // TODO - not interested in the events covered in keydown, like enter etc
    if (e.which == 13) return;

    var model = this.selection.startBlock;
    var text = this.el.childNodes[this.selection.startIx].innerText;

    if (text == "\n") text = '';     // Empty paragraphs
    model.setText(text);

    // TODO: we need to determine the block(s) involved
    // (if any), map the DOM back to a model representation,
    // then push those changes to the model.
    // pretty similar to the process for parsing pasted
    // text/html.
  }
});
