// ---------------------------------------------
//  Unordered List
// ---------------------------------------------

MediumEditor.UnorderedListModel = MediumEditor.BlockModel.extend({
  init: function(attrs) {
    this._super(attrs);
    this.tag = 'ul';
    this.text = '';
  },
});
