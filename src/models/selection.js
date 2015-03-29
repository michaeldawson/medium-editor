// ------------------------------------------------
//  Selection
// ------------------------------------------------
//  Models the selection. This never gets
//  persisted - it's only really a model because
//  other models (such as document) rely upon it.
// ------------------------------------------------

MediumEditor.SelectionModel = MediumEditor.Model.extend({

  // ----------------------------------------------
  //  Selection Types
  // ----------------------------------------------
  //  The types of selection. This is
  //  automatically determined when new selection
  //  attributes are set.
  // ----------------------------------------------

  TYPES: {
    NULL:                 {},
    CARET:                {},
    RANGE:                {},
    MEDIA:                {}
  },

  // ----------------------------------------------
  //  Constructor
  // ----------------------------------------------

  init: function(attrs) {
    this._super(attrs);
    this._setAttributes(attrs);
    this._determineType();
  },

  // ----------------------------------------------
  //  Type Queries
  // ----------------------------------------------

  isNull: function() {
    return this._type == this.TYPES.NULL;
  },

  isCaret: function() {
    return this._type == this.TYPES.CARET;
  },

  isRange: function() {
    return this._type == this.TYPES.RANGE;
  },

  isMedia: function() {
    return this._type == this.TYPES.MEDIA;
  },

  // ----------------------------------------------
  //  Accessors
  // ----------------------------------------------

  startBlock: function() {
    return this.isNull() ? null : this._document.blocks().at(this._startIx);
  },

  endBlock: function() {
    return this.isNull() ? null : this._document.blocks().at(this._endIx);
  },

  withinOneBlock: function() {
    return this._startIx == this._endIx;
  },

  spansBlocks: function() {
    return this._endIx > this._startIx;
  },

  entireBlock: function() {
    return this.withinOneBlock() && this._startOffset == 0 && this._endOffset == this.startBlock().text().length;
  },

  // ----------------------------------------------
  //  Mutators
  // ----------------------------------------------

  null: function() {
    this._setAttributes({});
  },

  set: function(attrs, options) {
    this._setAttributes(attrs, options);
  },

  // ----------------------------------------------
  //  Utility Methods
  // ----------------------------------------------

  _setAttributes: function(attrs, options) {

    // Set default options. Supported options are
    // `triggerEvent` (boolean) and `caller` (the
    // object which is requesting the change, so
    // objects which both subscribe to selection
    // change events and cause them can avoid
    // infinite loops in their handlers).
    if (typeof options === 'undefined') options = {};
    if (typeof options['triggerEvent'] === 'undefined') options['triggerEvent'] = true;

    // Shorthand notation for caret selections
    if (typeof attrs['ix'] !== 'undefined') {
      attrs['startIx'] = attrs['ix'];
      attrs['endIx'] = attrs['ix'];
    }
    if (typeof attrs['offset'] !== 'undefined') {
      attrs['startOffset'] = attrs['offset'];
      attrs['endOffset'] = attrs['offset'];
    }

    if (attrs['startIx']      != this._startIx ||
        attrs['startOffset']  != this._startOffset ||
        attrs['endIx']        != this._endIx ||
        attrs['endOffset']    != this._endOffset) {
          this._startIx = attrs['startIx'];
          this._startOffset = attrs['startOffset'];
          this._endIx = attrs['endIx'];
          this._endOffset = attrs['endOffset'];
          this._determineType();
          if (options['triggerEvent']) this.trigger('changed', this, options['caller']);
    }
    if (attrs['document']) this._document = attrs['document'];
  },

  // Automatically determine the selection type
  // based upon the attributes
  _determineType: function() {
    if (this._startIx === undefined) {
      this._type = this.TYPES.NULL;
    } else if (this._document.blocks().at(this._startIx).isMedia()) {
      this._type = this.TYPES.MEDIA;
    } else if (this._startIx == this._endIx && this._startOffset == this._endOffset) {
      this._type = this.TYPES.CARET;
    } else {
      this._type = this.TYPES.RANGE;
    }
  },

});
