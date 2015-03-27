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
    this._blocks = MediumEditor.ModelDOMMapper.parseHTMLIntoBlockCollection({ document: this, html: attrs['html'] || '' });
  },

  // ----------------------------------------------
  //  Accessors
  // ----------------------------------------------

  blocks: function() {
    return this._blocks;
  },

  // ----------------------------------------------
  //  Instance Methods
  // ----------------------------------------------

  setText: function(text, block) {
    if (text != block.text()) {
      block.setText(text);
      this.trigger('changed');
    }
  },

  removeBlockAt: function(ix) {
    this._blocks.removeAt(ix);
    this.trigger('changed');
  },

  changeBlockType: function(newType, attrs, selection) {
    if (selection == undefined) {
      selection = attrs;
      attrs = undefined;
    }
    var block = this._blocks.at(selection._startIx);
    block.setType(newType, attrs);
    this.trigger('changed');
  },

  addMarkup: function(type, selection) {
    var block = this._blocks.at(selection._startIx);
    block.addMarkup(selection._startOffset, selection._endOffset, type);
  },

  insertBlockAt: function(type, index, attributes) {
    attributes = typeof attributes === 'undefined' ? {} : attributes;
    attributes['type'] = type;
    var newBlock = new MediumEditor.BlockModel(attributes);
    this._blocks.insertAt(newBlock, index);
    this.trigger('changed');
  },

});
