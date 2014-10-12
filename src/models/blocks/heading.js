// ---------------------------------------------
//  Heading
// ---------------------------------------------

MediumEditor.HeadingModel = MediumEditor.TextBlockModel.extend({
  init: function(attrs) {
    this._super(attrs);
    this.tag = 'h3';
  }
});
