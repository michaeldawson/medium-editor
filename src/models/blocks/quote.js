// ---------------------------------------------
//  Quote
// ---------------------------------------------

MediumEditor.QuoteModel = MediumEditor.TextBlockModel.extend({
  init: function(attrs) {
    this._super(attrs);
    this.tag = 'blockquote';
  }
});
