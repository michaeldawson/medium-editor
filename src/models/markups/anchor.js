// ---------------------------------------------
//  Anchor
// ---------------------------------------------

MediumEditor.AnchorModel = MediumEditor.MarkupModel.extend({
  init: function(attrs) {
    this._super(attrs);
    this.tag = 'a';
    this.href = '';
  },
  isSameClassAs: function(other) {
    return other instanceof MediumEditor.AnchorModel;
  },
  openingTag: function() {
    return '<a href="' + this.href + '">';
  }
});
