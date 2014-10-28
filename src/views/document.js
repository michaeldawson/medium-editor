// ---------------------------------------------
//  Document
// ---------------------------------------------
//  The document view. Doesn't do anything
//  particularly interesting - just creates
//  views for all the blocks and listens for
//  new blocks being created.
// ---------------------------------------------

MediumEditor.DocumentView = MediumEditor.View.extend({

  // ---------------------------------------------
  //  Constructor
  // ---------------------------------------------

  init: function(attrs) {
    this._super(attrs);

    // Create the document view element
    this._el = document.createElement('div');
    this._el.className = 'medium-editor-document';
    this._el.contentEditable = true;

    // Add views for each existing block and
    // begin listening for any new blocks being
    // added
    this._model.children().on('add', this._onBlockAdded.bind(this));
    for(var i = 0; i < this._model.children().size(); i++) {
      var block = this._model.children().at(i);
      this.on('changed', block, this._render.bind(this));
      this._addBlock(block);
    }
  },

  // ---------------------------------------------
  //  Event Handlers
  // ---------------------------------------------

  _onBlockAdded: function(blockModel, ix) {
    this._addBlock(blockModel, ix);
  },

  // ---------------------------------------------
  //  Utility Methods
  // ---------------------------------------------

  _addBlock: function(blockModel, ix) {
    var blockView = new MediumEditor.BlockView({ model: blockModel });
    if (ix === undefined || ix >= this._el.childNodes.length) {
      this._el.appendChild(blockView._el);
    } else {
      this._el.insertBefore(blockView._el, this._el.childNodes[ix]);
    }
  },

  _render: function() {
    this._el.innerHTML = this._model.html();
  }
});
