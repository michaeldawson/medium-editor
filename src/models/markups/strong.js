// ---------------------------------------------
//  Strong
// ---------------------------------------------

MediumEditor.StrongModel = MediumEditor.MarkupModel.extend({
  init: function(attrs) {
    this._super(attrs);
    this.tag = 'strong';
  },
  isSameClassAs: function(other) {
    return other instanceof MediumEditor.StrongModel;
  }
});
