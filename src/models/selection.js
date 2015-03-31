// ------------------------------------------------
//  Selection
// ------------------------------------------------
//  Models the selection. This never gets
//  persisted - it's only really a model because
//  other models (such as document) rely upon it.
//  Currently supported types:
//
//    NULL
//    CARET
//    RANGE
//    MEDIA
// ------------------------------------------------

MediumEditor.SelectionModel = MediumEditor.Model.extend({

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
    return this._type == 'NULL';
  },

  isCaret: function() {
    return this._type == 'CARET';
  },

  isRange: function() {
    return this._type == 'RANGE';
  },

  isMedia: function() {
    return this._type == 'MEDIA';
  },

  // ----------------------------------------------
  //  Accessors
  // ----------------------------------------------

  type: function() {
    return this._type;
  },

  startIx: function() {
    return this._startIx;
  },

  endIx: function() {
    return this._endIx;
  },

  startOffset: function() {
    return this._startOffset;
  },

  endOffset: function() {
    return this._endOffset;
  },

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
    return !this.withinOneBlock();
  },

  // ----------------------------------------------
  //  Mutators
  // ----------------------------------------------

  null: function() {
    this._setAttributes({});
  },

  media: function(ix) {
    this.caret(ix, 0);
  },

  caret: function(ix, offset, options) {
    this._setAttributes({
      startIx:      ix,
      startOffset:  offset,
      endIx:        ix,
      endOffset:    offset,
    });
  },

  set: function(attrs, options) {
    this._setAttributes(attrs, options);
  },

  _setAttributes: function(attrs, options) {

    // Set default options. Supported options are
    // `triggerEvent` (boolean) and `caller` (the
    // object which is requesting the change, so
    // objects which both subscribe to selection
    // change events and cause them can avoid
    // infinite loops in their handlers).
    if (typeof options === 'undefined') options = {};
    if (typeof options['triggerEvent'] === 'undefined') options['triggerEvent'] = true;

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
      this._type = 'NULL';
    } else if (this._startOffset == 0 && this._document.blocks().at(this._startIx).isMedia()) {
      this._type = 'MEDIA';
    } else if (this._startIx == this._endIx && this._startOffset == this._endOffset) {
      this._type = 'CARET';
    } else {
      this._type = 'RANGE';
    }
  }

});
