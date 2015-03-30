// ------------------------------------------------
//  Markup
// ------------------------------------------------
//  Markups describe formatting (such as strong or
//  emphasis), or links. They have start and end
//  values, which correspond to the start and end
//  character indices of the block to which they
//  belong. Currently supported types:
//
//    STRONG
//    EMPHASIS
//    ANCHOR
// ------------------------------------------------

MediumEditor.MarkupModel = MediumEditor.Model.extend({

  // ----------------------------------------------
  //  Constructor
  // ----------------------------------------------

  init: function(attrs) {
    this._super(attrs);
    this._setAttributes(attrs);
  },

  // ----------------------------------------------
  //  Type Queries
  // ----------------------------------------------

  isStrong: function() {
    return this._type == 'STRONG';
  },

  isEmphasis: function() {
    return this._type == 'EMPHASIS';
  },

  isAnchor: function() {
    return this._type == 'ANCHOR';
  },

  // ----------------------------------------------
  //  Accessors
  // ----------------------------------------------

  type: function() {
    return this._type;
  },

  start: function() {
    return this._start;
  },

  end: function() {
    return this._end;
  },

  metadata: function() {    // Only relevant for anchors at this stage
    return this._metadata;
  },

  // Does this markup touch another?
  touches: function(other) {
    return this._start <= other._end && this._end >= other._start;
  },

  // Does this markup cover another?
  covers: function(other) {
    return this._start <= other._start && this._end >= other._end;
  },

  supportsMetadata: function() {
    return this.isAnchor();
  },

  // ----------------------------------------------
  //  Mutators
  // ----------------------------------------------

  setStart: function(start) {
    this._start = start;
    this.trigger('changed');
  },

  setEnd: function(end) {
    this._end = end;
    this.trigger('changed');
  },

  setMetadata: function(key, value) {
    if (this._metadata[key] != value) {
      this._metadata[key] = value;
      this.trigger('changed');
    }
  },

  // Set the given attributes (and provides
  // defaults) and nulls any which aren't
  // appropriate for the type (e.g. metadata on a
  // strong markup)
  _setAttributes: function(attrs) {
    this._type = attrs['type'] || 'STRONG';
    this._start = attrs['start'] || 0;
    this._end = attrs['end'] || 0;
    this._metadata = this.supportsMetadata() ? (attrs['metadata'] || {}) : null;

    // Swap start and end if end comes before start
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
