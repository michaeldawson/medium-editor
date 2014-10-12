// ---------------------------------------------
//  Markup
// ---------------------------------------------

MediumEditor.MarkupCollection = MediumEditor.Collection.extend({

  init: function(attrs) {
    this._super(attrs);
    this.on('add', this._onItemAdded.bind(this));
  },

  // Normalise the collection after new markup is
  // added
  _onItemAdded: function(markup) {
    this._normalise(markup);
  },

  // Given a plain text string, apply all markups
  // in this collection to produce and return a
  // HTML string.
  //
  // Note, we need to ensure precedence here. For
  // example, if a strong an an emphasis both
  // start at the same offset, we should return
  // '<strong><em> ...' rather than
  // '<em><strong> ...' (or the other way around
  // - doesn't matter, so long as it's
  // consistent).
  //
  // We also need to consider that markups of
  // different types in the collection can
  // overlap each other, but the produced HTML
  // needs to respect nesting rules.e.g.:
  //
  //   <strong>hi<em></strong>there</em>   <-- invalid

  apply: function(text) {

    // If there are no markups to apply, just
    // return the plain text
    if (this.size() == 0) return text;

    // For each item in the array, create an
    // 'inject' - an object representing an
    // instance where we need to inject some
    // HTML into the string. Each markup has
    // two injects - one for the opening and
    // one for the closing.
    var injects = [];
    for (var i = 0; i < this.size(); i++) {
      var markup = this.at(i);
      injects.push({ type: 'open', at: markup.start, obj: markup });
      injects.push({ type: 'close', at: markup.end, obj: markup });
    }

    // Sort the injects by the index they
    // occur at, then by the type, then
    // finally by the tag string
    injects.sort(function(a,b) {
      if (a.at != b.at) {
        return a.at - b.at;     // Sort by offset first
      } else {

        // Then by close ahead of open
        if (a.type[0] != b.type[0]) {
          return this._charComparison(a.type[0], b.type[0]);
        } else {

          // Then by the tag name
          var order = a.type == 'open' ? 1 : -1;                                    // Reverse order for closing tags
          return this._charComparison(a.obj.tag[0], b.obj.tag[0]) * order;
        }
      }
    });

    var toReturn = '';
    var textIx = 0;

    // Go through the injects, keeping track
    // of all the open tags
    var openTags = [];
    for (var i = 0; i < injects.length; i++) {
      var inject = injects[i];

      // Add the text up to this point and update
      // the text indx
      toReturn += text.substring(textIx, inject.at);
      textIx = inject.at;

      if (inject.type == 'open') {

        // Tag opening
        toReturn += inject.obj.openingTag();
        openTags.push(inject);

      } else {

        // Tag closing. Grab all the open tags which
        // end after this one.
        var temp = [];
        var c;
        while((c = openTags.pop()).tag != inject.tag) {
          temp.push(c);
        }

        // Close the other tags first
        for (var j = 0; j < temp.length; j++) {
          toReturn += temp[j].obj.closingTag();
        }

        // Now close this tag
        toReturn += inject.obj.closingTag();

        // Now put the other tags back
        while(temp.length) openTags.push(temp.pop());
      }
    }

    // Grab any remaining characters
    toReturn += text.substring(textIx);
    return toReturn
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
        if (other instanceof MediumEditor.AnchorModel && other.href != added.href) {

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
      if (x.isSameClassAs(subject) && x != subject) toReturn.push(x);
    }
    return toReturn;
  },

  // Helper utility to compare two characters
  _charComparison: function(a,b) {
    if (a < b) {
      return -1;
    } else if (a > b) {
      return 1;
    } else {
      return 0;
    }
  }

});
