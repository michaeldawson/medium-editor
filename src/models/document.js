// ---------------------------------------------
//  Document
// ---------------------------------------------
//  A document is made up of blocks (which may
//  be paragraphs, lists, images etc.)
// ---------------------------------------------

MediumEditor.DocumentModel = MediumEditor.Model.extend({

  // ---------------------------------------------
  //  Constructor
  // ---------------------------------------------

  init: function(attrs) {
    this._super(attrs);

    // Our collection of block models
    this._children = new MediumEditor.BlockCollection({ model: this });

    // Parse the given HTML into block models,
    // adding them to the collection
    this._parse(attrs['html'] || '');
  },

  // ---------------------------------------------
  //  Accessors
  // ---------------------------------------------

  html: function() {
    return this._children.html();
  },

  children: function() {
    return this._children;
  },

  // ---------------------------------------------
  //  Mutators
  // ---------------------------------------------

  setText: function(text, selection) {
    this._children.at(selection._startIx).setText(text);  // TODO
    this.trigger('changed');
  },

  // Given a selection model, insert a paragraph.
  // Note, the selection may be a caret (simply
  // split the block at the caret point and add
  // the trailing content to the new block) or a
  // range (destroy content within the range, add
  // the trailing content to a new block and add
  // a blank block in between).
  insertParagraph: function(selection) {

    var remainderText = '';
    var type = 'PARAGRAPH';
    for (var i = selection._startIx; i <= selection._endIx; i++) {

      var block = this._children.at(i);

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
    this._children.insertAt(newParagraph, selection._startIx + 1);
    this.trigger('changed');
  },

  changeBlockType: function(newType, attrs, selection) {
    if (selection == undefined) {
      selection = attrs;
      attrs = undefined;
    }
    var block = this._children.at(selection._startIx);
    block.changeType(newType, attrs);
    this.trigger('changed');
  },

  // ---------------------------------------------
  //  Utility Methods
  // ---------------------------------------------

  // Given a HTML string of a document, parse it
  // into a model representation.
  _parse: function(htmlStr) {
    var el = document.createElement('div');
    el.innerHTML = htmlStr.trim();
    for(var i = 0; i < el.children.length; i++) {
      var node = el.children[i];
      this._children.add(new MediumEditor.BlockModel({ html: node.outerHTML }));
    }
  },







  markup: function(selection, markupKlass) {
    if (selection.type != 'range') return;
    for(var i = selection.startIx; i <= selection.endIx; i++) {
      var block = this.children.at(i);
      var start = i == selection.startIx ? selection.startOffset : 0;
      var end = i == selection.endIx ? selection.endOffset : block.text.length;
      block.markups.add(new markupKlass({ start: start, end: end }));
    }
  }
});
