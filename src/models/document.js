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

  setText: function(text, selection) {
    this._blocks.at(selection._startIx).setText(text);
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

  // Given a selection model, insert a paragraph.
  // Note, the selection may be a caret (simply
  // split the block at the caret point and add the
  // trailing content to the new block) or a range
  // (destroy content within the range, add the
  // trailing content to a new block and add a
  // blank block in between).
  insertParagraph: function(selection) {

    var remainderText = '';
    var type = 'PARAGRAPH';
    for (var i = selection._startIx; i <= selection._endIx; i++) {

      var block = this._blocks.at(i);

      if (i == selection._endIx) {
        var postText = block.text().substring(selection._endOffset);
        if (i == selection._startIx) {
          remainderText = postText;
        } else {
          if (selection._endOffset > 0) {
            block.setText(postText);
          }
        }
      }

      if (i > selection._startIx && i < selection._endIx) {
        // TODO - kill it
      }

      if (i == selection._startIx) {
        if (block.isListItem() && block.text() != '') type = block.isOrderedListItem() ? 'ORDERED_LIST_ITEM' : 'UNORDERED_LIST_ITEM';
        if (selection._startOffset < block.text().length) {
          block.setText(block.text().substring(0, selection._startOffset));
        }
      }
    }

    var newParagraph = new MediumEditor.BlockModel({ text: remainderText, type: type });
    this._blocks.insertAt(newParagraph, selection._startIx + 1);
    this.trigger('changed');
  },

});
