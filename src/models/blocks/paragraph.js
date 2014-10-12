// ---------------------------------------------
//  Paragraph
// ---------------------------------------------

MediumEditor.ParagraphModel = MediumEditor.TextBlockModel.extend({
  init: function(attrs) {
    this._super(attrs);
    this.tag = 'p';
  }
});
