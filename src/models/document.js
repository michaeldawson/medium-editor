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

  isBlank: function() {
    return this._blocks.size() == 1 && this._blocks.at(0).text() == '';
  },

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

  markup: function(type, selection) {
    if (selection.isNull() || selection.isMedia()) return false;    // Only applicable to text selections

    // Run through every block in the selection
    for(var i = selection._startIx; i <= selection._endIx; i++) {
      var block = this._blocks.at(i);

      // Determine the start and end offsets of the
      // selection in this block
      var startOffset = i == selection._startIx ? selection._startOffset : 0;
      var endOffset = i == selection._endIx ? selection._endOffset : block.text().length;

      // Mark it up
      block.markup(startOffset, endOffset, type);
    }

    this.trigger('changed');
  },

  insertBlockAt: function(type, index, attributes) {
    attributes = typeof attributes === 'undefined' ? {} : attributes;
    attributes['type'] = type;
    var newBlock = new MediumEditor.BlockModel(attributes);
    this._blocks.insertAt(newBlock, index);
    this.trigger('changed');
  },

  // Return true if the given selection is entirely
  // within the given type of markup, otherwise
  // false.
  isSelectionWithinMarkupType: function(type, selection) {
    if (selection.isNull() || selection.isMedia()) return false;    // Only applicable to text selections

    // Run through every block in the selection
    for(var i = selection._startIx; i <= selection._endIx; i++) {
      var block = this._blocks.at(i);

      // Determine the start and end offsets of the
      // selection in this block
      var startOffset = i == selection._startIx ? selection._startOffset : 0;
      var endOffset = i == selection._endIx ? selection._endOffset : block.text().length;

      // If any part of that selection is outside
      // the given markup type, return false
      if (!block.isRangeMarkedUpAs(type, startOffset, endOffset)) return false;
    }

    return true;
  },

  // Return true if the given selection is entirely
  // within the given type of block, otherwise
  // false.
  isSelectionWithinBlockType: function(type, selection) {
    if (selection.isNull()) return false;

    // Run through every block in the selection
    var temp = new MediumEditor.BlockModel({ type: type });
    for(var i = selection._startIx; i <= selection._endIx; i++) {
      var block = this._blocks.at(i);

      // Is this block of the given type?
      if (block.type() != temp.type()) return false;
    }

    return true;
  },

});
