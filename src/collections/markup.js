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

  // Override the add method to implement toggle
  // behaviour and normalise the markup.
  //
  // Scenarios (where A is the new markup and B
  // is an existing markup of the same type):
  //
  //    AAAAA     New markup covers old
  //     BBB      Remove B (AAAAA)
  //
  //     AAA      New markup is within old
  //    BBBBB     Un-mark the existing range (B   A)
  //
  //     AAA      New and existing are the same
  //     BBB      Unmark, leaving nothing ()
  //
  //    AAA       New partially covers old
  //      BBB     Extend A's range (AAABB) and remove B
  //
  //      AAA     New partially covers old
  //    BBB       Extend A's range (AAABB) and remove B
  //
  //    AA        New is consecutive to existing
  //      BBB     Extend A's range (AAAAA) and remove B
  //
  //       AA     New is consecutive to existing
  //    BBB       Extend A's range (AAAAA) and remove B
  //
  //      A       New would joined two existing
  //    BB CC     Will be handled in two steps
  //
  //    AA        New and existing are separate
  //       BB     Add the new (AA BB)
  //
  // Anchors are a special case. If new and
  // existing items have the same href, they act
  // like other markups. If the hrefs are different,
  // the new href is applied and subsumes the
  // existing range of any overlapping anchors.
  //
  add: function(item) {

    // Get markups of the same type and sort
    // them by start index
    var others = this._otherItemsOfSameType(item);
    others.sort(function(a,b) { return a.start() - b.start() });

    // Run through the others
    for(var i = 0; i < others.length; i++) {
      var other = others[i];

      if (other.covers(item)) {

        //  AAA
        // BBBBB                    <-- Toggle (B   A)
        this._toggle(other, item);
        return;                     // We can exit here because A was within B, so there shouldn't be any further interactions

      } else if (other.touches(item)) {

        // If the items are not anchors with the
        // same hrefs, extend the new item's range
        // and remove the existing
        if (!item.isAnchor() || item.metadata()['href'] == other.metadata()['href']) {

          item.setStart(Math.min(other.start(), item.start()));
          item.setEnd(Math.max(other.end(), item.end()));
          this.remove(other);

        } else {

          // Anchors with different hrefs. Keep
          // both, but separate their ranges - new
          // item gets precedence.
          if (item.covers(other)) {
            this.remove(other);
          } else {
            other.setStart(Math.max(other.start(), item.end()));
            other.setEnd(Math.min(other.end(), item.start()));
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
    var others = this._itemsOfType(subject.type());
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
  },

  // Given an existing item and a new item, where
  // the existing item entirely covers the new item,
  // toggle the markup so only the sections outside
  // the new item remain. This may involve updating
  // the existing item, removing it or adding
  // another.
  _toggle: function(existingItem, newItem) {
    if (!existingItem.covers(newItem)) return;

    var beforeStart = existingItem.start();
    var beforeEnd = newItem.start();
    var afterStart = newItem.end();
    var afterEnd = existingItem.end();

    if (beforeStart == beforeEnd && afterStart == afterEnd) {

      // The two share the same range. Just remove
      // existing.
      this.remove(existingItem);

    } else if (beforeStart == beforeEnd) {

      // The new item is aligned to the left
      // boundary of the existing. Update the
      // existing's range.
      existingItem.setStart(afterStart);

    } else if (afterStart == afterEnd) {

      // The new item as aligned to the right
      // boundary of the existing. Update the
      // existing's range.
      existingItem.setEnd(beforeEnd);

    } else {

      // The new and existing items do not share
      // any boundaries.
      existingItem.setEnd(beforeEnd);
      this.add(new MediumEditor.MarkupModel({ type: newItem.type(), start: afterStart, end: afterEnd }));
    }

    // Add the new item if it's an anchor and the
    // href differs to the existing item
    if(newItem.isAnchor() && newItem.metadata()['href'] == existingItem.metadata()['href']) {
      this.add(newItem);
    }
  }

});
