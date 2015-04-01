// ------------------------------------------------
//  Document
// ------------------------------------------------
//  A document is made up of blocks (which may be
//  paragraphs, list items, images etc.)
// ------------------------------------------------

MediumEditor.DocumentModel = MediumEditor.Model.extend({

  // ----------------------------------------------
  //  Constructor
  // ----------------------------------------------

  init: function(attrs) {
    this._super(attrs);

    // Our collection of block models. Use the
    // Model-DOM mapper to parse the given HTML
    // string (assuming one was provided) into a
    // collection of block models.
    this._blocks = MediumEditor.ModelDOMMapper.parseHTMLIntoBlockCollection({
      document: this,
      html: attrs['html'] || '<p></p>'
    });

    // Attach changed event listeners
    for(var i = 0; i < this._blocks.size(); i++) {
      this.on('changed', this._blocks.at(i), this._onBlockChanged.bind(this));
    }
  },

  // ----------------------------------------------
  //  Event handlers
  // ----------------------------------------------

  _onBlockChanged: function() {
    this.trigger('changed');
  },

  // ----------------------------------------------
  //  Accessors
  // ----------------------------------------------

  blocks: function() {
    return this._blocks;
  },

  isBlank: function() {
    return this._blocks.size() == 1 && !this._blocks.at(0).isListItem() && this._blocks.at(0).text() == '';
  },

  // ----------------------------------------------
  //  Mutators
  // ----------------------------------------------

  removeBlockAt: function(ix) {
    this._blocks.removeAt(ix);
    this.trigger('changed');
  },

  insertBlockAt: function(type, index, attributes) {
    attributes = typeof attributes === 'undefined' ? {} : attributes;
    attributes['type'] = type;
    var newBlock = new MediumEditor.BlockModel(attributes);
    this.on('changed',newBlock, this._onBlockChanged.bind(this));
    this._blocks.insertAt(newBlock, index);
    this.trigger('changed');
  },

  toggleMarkup: function(type, selection) {

    // Run through every block in the selection
    for(var i = selection._startIx; i <= selection._endIx; i++) {
      var block = this._blocks.at(i);

      // Determine the start and end offsets of the
      // selection in this block
      var startOffset = i == selection.startIx() ? selection.startOffset() : 0;
      var endOffset = i == selection.endIx() ? selection.endOffset() : block.text().length;

      // Mark it up
      if (startOffset != endOffset) {
        block.markup(startOffset, endOffset, type, { silent: true });
      }
    }
    this.trigger('changed');
  },

  setType: function(newType, selection) {
    for(var i = selection._startIx; i <= selection._endIx; i++) {
      var block = this._blocks.at(i);
      block.setType(newType, { silent: true });
    }
    this.trigger('changed');
  },

  setLayout: function(type, selection) {
    for(var i = selection._startIx; i <= selection._endIx; i++) {
      var block = this._blocks.at(i);
      block.setLayout(type, { silent: true });
    }
    this.trigger('changed');
  }

});
