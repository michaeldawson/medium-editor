// ---------------------------------------------
//  Video
// ---------------------------------------------

MediumEditor.VideoModel = MediumEditor.BlockModel.extend({
  init: function(attrs) {
    this._super(attrs);
    this.tag = 'video';
  },
});
