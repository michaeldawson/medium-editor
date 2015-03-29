// ------------------------------------------------
//  Markup
// ------------------------------------------------

MediumEditor.MarkupCollection = MediumEditor.Collection.extend({

  // ----------------------------------------------
  //  Constructor
  // ----------------------------------------------

  init: function(attrs) {
    this._super(attrs);
  },

  // Override the add method to normalise markup.
  //
  //  1. If two markups of the same kind overlap,
  //     they should be compressed into a single
  //     markup
  //
  //     a) Unless those markups are links
  //        with difference hrefs, in which
  //        case they're separated
  //
  //  2. If two markups of the same kind are
  //     consecutive, they should be compressed
  //     into a single markup
  //
  //     a) Unless they're links with different
  //        hrefs
  //
  add: function(item) {

    // Get markups of the same type and sort
    // them by start index
    var others = this._otherItemsOfSameType(item);
    others.sort(function(a,b) { return a.start() - b.start() });

    // Run through the others
    for(var i = 0; i < others.length; i++) {
      var other = others[i];

      // If it overlaps with, or is consecutive to,
      // the new item ...
      if (other.touches(item)) {

        // If it's not an anchor, or has the same
        // href, just merge them
        if (!other.isAnchor() || other.metadata()['href'] == item.metadata()['href']) {

          other.setStart(Math.min(other.start(), item.start()));
          other.setEnd(Math.max(other.end(), item.end()));
          return;

        } else {

          if (item.covers(other)) {

            // If the new markup covers the old
            // markup entirely, replace it
            other.setStart(item.start());
            other.setEnd(item.end());
            other.metadata()['href'] = item.metadata()['href'];
            return;

          } else if (other.covers(item)) {

            // If the old markup covers the new
            // one, split them
            var beforeStart = other.start();
            var beforeEnd = item.start();
            var afterStart = item.end();
            var afterEnd = other.end();

            if (beforeStart == beforeEnd) {
              other.setStart(afterStart);
            } else if (afterStart == afterEnd) {
              other.setEnd(beforeEnd);
            } else {
              other.setEnd(beforeEnd);
              var newOther = new MediumEditor.MarkupModel({ type: other.type, start: afterStart, end: afterEnd });
              this.add(newOther);
            }

          } else {

            // Otherwise just separate them, with
            // the new markup taking precedence
            other.setStart(Math.max(other.start(), item.end()));
            other.setEnd(Math.min(other.end(), item.end()));
          }
        }
      }
    }

    this._super(item);
  },

  // Returns true if the given range is entirely
  // marked up as the given type, otherwise false.
  isRangeMarkedUpAs: function(type, startOffset, endOffset) {
    var temp = new MediumEditor.MarkupModel({ type: type, start: 0, end: 1 });
    var items = this._itemsOfType(temp.type());
    for(var i = 0; i < items.length; i++) {
      var item = items[i];
      if (item.isAnchor()) {
        // Anchors are a special case
        if (item.start() <= startOffset) {
          if (item.end() >= endOffset) return true;
          startOffset = item.end();
        }
      } else {
        if (item.start() <= startOffset && item.end() >= endOffset) return true;
      }
    }
    return false;
  },

  // Given a markup object, returns other markups
  // of the same kind in the collection
  _otherItemsOfSameType: function(subject) {
    var others = this._itemsOfType(subject);
    var ix = others.indexOf(subject);
    if (ix >= 0) others.splice(ix, 1);
    return others;
  },

  _itemsOfType: function(type) {
    var toReturn = [];
    for (var i = 0; i < this.size(); i++) {
      var x = this.at(i);
      if (x.type() == type) toReturn.push(x);
    }
    return toReturn;
  }

});
