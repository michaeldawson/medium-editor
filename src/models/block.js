// ---------------------------------------------
//  Block
// ---------------------------------------------
//  Abstract. Blocks belong to documents and
//  contain the text and/or metadata needed to
//  render them.
// ---------------------------------------------

MediumEditor.BlockModel = MediumEditor.Model.extend({
  init: function(attrs) {
    this._super(attrs);
    this.parent = null;       // Refers to the document model this block belongs to
    this.tag = 'div';
  },
  innerHTML: function() {
    return '';
  },
  html: function() {
    return '<' + this.tag + '>' + this.innerHTML() + '</' + this.tag + '>';
  }
});
