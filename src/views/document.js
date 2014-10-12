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
  }
});
