// ---------------------------------------------
//  Block
// ---------------------------------------------

MediumEditor.BlockCollection = MediumEditor.Collection.extend({
  init: function(attrs) {
    this._super(attrs);
  },
  html: function() {
    var toReturn = '';
    for(var i = 0; i < this.size(); i++) {
      toReturn += this.at(i).html();
    }
    return toReturn;
  }
});
