// ------------------------------------------------
//  Markup
// ------------------------------------------------

MediumEditor.MarkupCollection = MediumEditor.Collection.extend({

  // ----------------------------------------------
  //  Constructor
  // ----------------------------------------------

  init: function(attrs) {
    this._super(attrs);
    this.on('add', this._onItemAdded.bind(this));
  },

  // Normalise the collection after new markup is
  // added
  _onItemAdded: function(markup) {
    this._normalise(markup);
  },

  // Called after a markup is added to the
  // collection. Enforces rules:
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
  _normalise: function(added) {

    // Get markups of the same kind and sort
    // them by start index
    var others = this._otherItemsOfSameKind(added);
    others.sort(function(a,b) { return a.start - b.start });

    // Run through the others
    for(var i = 0; i < others.length; i++) {
      var other = others[i];

      // If it overlaps with, or is consecutive to,
      // the new item ...
      if (other.touches(added)) {

        // If it's an anchor with a different href,
        // separate them
        if (other.isAnchor() && other.href != added.href) {

          // If the new markup covers the old markup
          // entirely, replace it
          if (added.covers(other)) {

            this.remove(other);

          } else {

            // Otherwise just separate them, with the new
            // markup taking precedence
            other.start = Math.max(other.start, added.end);
            other.end = Math.min(other.end, added.end);
          }

        } else {

          // Merge them
          this.remove(other);
          added.start= Math.min(other.start, added.start);
          added.end = Math.max(other.end, added.end);
        }
      }
    }
  },

  // Given a markup object, returns other markups
  // of the same kind in the collection
  _otherItemsOfSameKind: function(subject) {
    var toReturn = [];
    for (var i = 0; i < this.size(); i++) {
      var x = this.at(i);
      if (x.type() == subject.type() && x != subject) toReturn.push(x);
    }
    return toReturn;
  },

});
