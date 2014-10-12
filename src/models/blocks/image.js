// ---------------------------------------------
//  Image
// ---------------------------------------------

MediumEditor.ImageModel = MediumEditor.BlockModel.extend({
  init: function(attrs) {
    this._super(attrs);
    this.tag = 'img';
  },
});
