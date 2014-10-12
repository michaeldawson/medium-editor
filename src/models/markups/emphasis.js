// ---------------------------------------------
//  Emphasis
// ---------------------------------------------

MediumEditor.EmphasisModel = MediumEditor.MarkupModel.extend({
  init: function(attrs) {
    this._super(attrs);
    this.tag = 'em';
  },
  isSameClassAs: function(other) {
    return other instanceof MediumEditor.EmphasisModel;
  }
});
