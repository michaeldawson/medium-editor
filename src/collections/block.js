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

      // Grab the current block, as well as the previous
      // and next blocks if they exist (we need to be
      // able to peek ahead and behind to decide which
      // wrapping tags to render).
      var prevBlock = i == 0 ? null : this.at(i - 1);
      var currentBlock = this.at(i);
      var nextBlock = i == this.size() - 1 ? null : this.at(i + 1);
      var html = '';

      // If this is the first item in a new layout, add
      // a tag to open it
      if (i == 0 || currentBlock.layout() != prevBlock.layout()) {
        html += "<div class='" + (currentBlock.layout() || 'layoutSingleColumn') + "'>";
      }

      // If this is the first item in a list, add the
      // opening list tag
      if (currentBlock.isListItem() && (                  // The current block is a list item, and ...
            i == 0 ||                                     // ... this is the first block, or ...
            !prevBlock.isListItem() ||                    // ... the last block wasn't a list item, or ...
            currentBlock.type() != prevBlock.type()       // ... the last block was a different kind of list item
          )) {
          html += currentBlock.isUnorderedListItem() ? '<ul>' : '<ol>';
      }

      // Now add the actual block HTML
      html += currentBlock.html();

      // If this is the last item in a list, add the
      // closing list tag
      if (currentBlock.isListItem() && (                  // The current block is a list item, and ...
            i == this.size() - 1 ||                       // ... this is the last block, or ...
            !nextBlock.isListItem() ||                    // ... the next block isn't a list item, or ...
            currentBlock.type() != nextBlock.type()       // ... the next block is a different kind of list item
          )) {
          html += currentBlock.isUnorderedListItem() ? '</ul>' : '</ol>';
      }

      // If this is the last item in a layout, add a
      // tag to close it
      if (i == this.size() - 1 || currentBlock.layout() != nextBlock.layout()) {
        html += "</div>";
      }

      toReturn += html;
    }
    return toReturn;
  }
});
