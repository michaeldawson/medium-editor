// ---------------------------------------------
//  Block
// ---------------------------------------------

MediumEditor.BlockCollection = MediumEditor.Collection.extend({
  init: function(attrs) {
    this._super(attrs);
    this.model = attrs['model'];
    this.on('add', this._onItemAdded.bind(this));
  },
  _onItemAdded: function(item) {
    item.parent = this.model;
  },
  html: function() {
    var toReturn = '';
    for(var i = 0; i < this.size(); i++) {
      toReturn += this.at(i).html();
    }
    return toReturn;
  }
});
