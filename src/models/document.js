// ---------------------------------------------
//  Document
// ---------------------------------------------
//  A document is made up of blocks (which may
//  be paragraphs, lists, images etc.)
// ---------------------------------------------

MediumEditor.DocumentModel = MediumEditor.Model.extend({
  init: function(attrs) {
    this._super(attrs);
    this.children = new MediumEditor.BlockCollection({ model: this });
    this._parse(attrs['html'] || '');

    // TODO - temporary
    var p = new MediumEditor.ParagraphModel({ text: 'The quick brown fox jumped over the lazy dog.' });
    this.children.add(p);
    p = new MediumEditor.DividerModel();
    this.children.add(p);
    p = new MediumEditor.ParagraphModel({ text: 'Lazy wizards brew something something queen.' });
    this.children.add(p);
  },
  html: function() {
    return this.children.html();
  },
  _parse: function(html) {
    // TODO
  },
  markup: function(selection, markupKlass) {
    if (!(selection instanceof MediumEditor.RangeSelection)) return;
    for(var i = selection.startBlockIx; i <= selection.endBlockIx; i++) {
      var block = this.children.at(i);
      var start = i == selection.startBlockIx ? selection.startOffset : 0;
      var end = i == selection.endBlockIx ? selection.endOffset : block.text.length;
      block.markups.add(new markupKlass({ start: start, end: end }));
    }
  },
  insertParagraph: function(selection) {

    if (selection instanceof MediumEditor.CaretSelection) {

      // Caret selections are simple - insert a new
      // paragraph after the current block and fill
      // it with whatever text occurs after the
      // offset in the current paragraph

      var block = this.children.at(selection.blockIx);
      var remainingText = block.text.substring(selection.offset);
      if (selection.offset < block.text.length) {
        block.text = block.text.substring(0, selection.offset);
        block.trigger('changed');
      }

      var newParagraph = new MediumEditor.ParagraphModel({ text: remainingText });
      this.children.insertAt(newParagraph, selection.blockIx + 1);




      // range, confined to a single block - insert a new p afterward and give it
      // all text after the end offset + remove the highlighted text from the
      // start block
      //   same for a li

      // range, spanning multiple blocks - kill everything after the offset in
      // the start block, all blocks in between and everything before the offset
      // in the end block, then insert an empty paragraph between them
      //   same for a li

      // caret - insert a new paragraph and fill it with whatever
      // text occurs in the current paragraph after the offset


    }

    // what if it begins on a heading and ends on something else, like an image or a li?


    // TODO - if selection is a normal caret, create a new paragraph and
    // fill it with whatever text occurs after the caret offset in the
    // current paragraph, then give it focus
    // if it's a list, add the next item (but don't inherit any of the
    // markups of the current cursor position)
    // it it's an image, create a new p under it
    // if it's a range, kill that range and create a new p

    // enter on an empty list item
    //   in the middle of a list?
  },
});