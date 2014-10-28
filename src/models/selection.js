// ---------------------------------------------
//  Selection
// ---------------------------------------------
//  Models the selection. This never gets
//  persisted - it's only really a model
//  because other models (such as document)
//  rely upon it.
// ---------------------------------------------

MediumEditor.SelectionModel = MediumEditor.Model.extend({

  // ---------------------------------------------
  //  Selection Types
  // ---------------------------------------------
  //  The types of selection. This is
  //  automatically determined when new selection
  //  attributes are set.
  // ---------------------------------------------

  TYPES: {
    NULL:                 {},
    CARET:                {},
    RANGE:                {}
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

  isNull: function() {
    return this._type == this.TYPES.NULL;
  },

  isCaret: function() {
    return this._type == this.TYPES.CARET;
  },

  isRange: function() {
    return this._type == this.TYPES.RANGE;
  },

  // ---------------------------------------------
  //  Mutators
  // ---------------------------------------------

  null: function() {
    this._setAttributes({});
  },

  set: function(attrs, caller) {
    this._setAttributes(attrs, caller);
  },

  // ---------------------------------------------
  //  Utility Methods
  // ---------------------------------------------

  _setAttributes: function(attrs, caller) {
    if (attrs['startIx']      != this._startIx ||
        attrs['startOffset']  != this._startOffset ||
        attrs['endIx']        != this._endIx ||
        attrs['endOffset']    != this._endOffset) {
          this._startIx = attrs['startIx'];
          this._startOffset = attrs['startOffset'];
          this._endIx = attrs['endIx'];
          this._endOffset = attrs['endOffset'];
          this._determineType();
          this.trigger('changed', this, caller);
    }
  },

  // Automatically determine the selection type
  // based upon the attributes
  _determineType: function() {
    if (this._startIx === undefined) {
      this._type = this.TYPES.NULL;
    } else if (this._startIx == this._endIx && this._startOffset == this._endOffset) {
      this._type = this.TYPES.CARET;
    } else {
      this._type = this.TYPES.RANGE;
    }
  }

});
