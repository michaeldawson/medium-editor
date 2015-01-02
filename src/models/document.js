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
    // Model-DOM mapper to parse the givem HTML
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

  setText: function(text, blockIx) {
    var block = this._blocks.at(blockIx);
    block.setText(text);
    this.trigger('changed');
  },

});
