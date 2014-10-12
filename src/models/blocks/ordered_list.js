// ---------------------------------------------
//  Ordered List
// ---------------------------------------------

MediumEditor.UnorderedListModel = MediumEditor.BlockModel.extend({
  init: function(attrs) {
    this._super(attrs);
    this.tag = 'ul';
    this.text = '';
  },
});

MediumEditor.OrderedListModel = MediumEditor.BlockModel.extend({
  init: function(attrs) {
    this._super(attrs);
    this.tag = 'ol';
    this.text = '';
  },
});

MediumEditor.ImageModel = MediumEditor.BlockModel.extend({
  init: function(attrs) {
    this._super(attrs);
    this.tag = 'img';
  },
});

MediumEditor.VideoModel = MediumEditor.BlockModel.extend({
  init: function(attrs) {
    this._super(attrs);
    this.tag = 'video';
  },
});

MediumEditor.DividerModel = MediumEditor.BlockModel.extend({
  init: function(attrs) {
    this._super(attrs);
    this.tag = 'hr';
  },
});
