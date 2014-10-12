// ---------------------------------------------
//  Divider
// ---------------------------------------------

MediumEditor.DividerModel = MediumEditor.BlockModel.extend({
  init: function(attrs) {
    this._super(attrs);
    this.tag = 'hr';
  },
});
