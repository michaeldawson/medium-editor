// ---------------------------------------------
//  Markup
// ---------------------------------------------
//  Markups describe formatting (such as strong
//  or emphasis), or links. They have start and
//  end values, which correspond to the start
//  and end character indices of the block to
//  which they apply.
// ---------------------------------------------

MediumEditor.MarkupModel = MediumEditor.Model.extend({

  // ---------------------------------------------
  //  Markup Types
  // ---------------------------------------------

  TYPES: {
    STRONG:               {},
    EMPHASIS:             {},
    ANCHOR:               {}
  },

  // ---------------------------------------------
  //  Constructor
  // ---------------------------------------------

  init: function(attrs) {
    this._super(attrs);
    this._setAttributes(attrs);
  },

  // ---------------------------------------------
  //  Accessors
  // ---------------------------------------------

  isAnchor: function() {
    return this._type == this.TYPES.ANCHOR;
  },

  // ---------------------------------------------
  //  Mutators
  // ---------------------------------------------

  // Given some HTML, wrap it in the appropriate
  // tag to apply the markup
  wrap: function(html) {

    // Grab the tag, based on the type
    var tag;
    switch(this._type) {
      case this.TYPES.STRONG:     tag = 'strong'; break;
      case this.TYPES.EMPHASIS:   tag = 'em'; break;
      case this.TYPES.ANCHOR:     tag = 'a'; break;
    }

    // Create the opening tag. For anchor, this
    // will include the href attribute.
    var openingTag = "<" + tag;
    if (this.isAnchor()) openingTag += " href='" + this._href + "'";
    openingTag += ">";
    return openingTag + html + "</" + tag + ">";
  },

  // Does this markup touch another?
  touches: function(other) {
    return this._start <= other._end && this._end >= other._start;
  },

  // Does this markup cover another?
  covers: function(other) {
    return this._start <= other._start && this._end >= other._end;
  },

  // ---------------------------------------------
  //  Utilities
  // ---------------------------------------------

  // Set the given attributes (and provides
  // defaults) and nulls any which aren't
  // appropriate for the type (e.g. href on a
  // strong markup)
  _setAttributes: function(attrs) {
    this._type = this.TYPES[(attrs['type'] || 'STRONG').toUpperCase()];
    this._start = attrs['start'] || 0;
    this._end = attrs['end'] || 0;
    this._href = !this._isAnchor() ? null : (attrs['href'] || '');

    // Swap start and end if end comes before
    // start
    if (this._start > this._end) {
      var temp = this._end;
      this._end = this._start;
      this._start = temp;
    }

    // Ensure the markup spans at least one
    // character
    if (this._start == this._end) {
      throw 'Start and end points of markup must be separate';
    }
  }

});
