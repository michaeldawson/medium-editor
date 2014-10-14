// ---------------------------------------------
//  Document
// ---------------------------------------------

MediumEditor.DocumentView = MediumEditor.View.extend({
  init: function(attrs) {
    this._super(attrs);

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
  }
});
