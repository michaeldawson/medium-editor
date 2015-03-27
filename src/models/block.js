// ------------------------------------------------
//  Block
// ------------------------------------------------
//  Blocks belong to documents and represent the
//  semantic components within, such as paragraphs,
//  list items, images etc. They contain text,
//  markups, metadata and layout settings.
// ------------------------------------------------

MediumEditor.BlockModel = MediumEditor.Model.extend({

  // ----------------------------------------------
  //  Block Types
  // ----------------------------------------------
  //  Arguably heading could be done as a single
  //  type, with the subtypes achieved as layouts,
  //  but unlike other uses for layouts
  //  (pullquotes, full-width images etc.),
  //  different levels of headings are different
  //  semantically.
  // ----------------------------------------------

  TYPES: {
    PARAGRAPH:            {},
    QUOTE:                {},
    HEADING1:             {},
    HEADING2:             {},
    HEADING3:             {},
    ORDERED_LIST_ITEM:    {},
    UNORDERED_LIST_ITEM:  {},
    DIVIDER:              {},
    IMAGE:                {},
    VIDEO:                {}
  },

  // ----------------------------------------------
  //  Constructor
  // ----------------------------------------------

  init: function(attrs) {
    this._super(attrs);
    this._setAttributes(attrs);
  },

  // ----------------------------------------------
  //  Accessors
  // ----------------------------------------------

  type: function() {
    return this._type;
  },

  text: function() {        // Not relevant for some blocks e.g. dividers, media
    return this._text;
  },

  layout: function() {      // Only relevant for quotes and media at this stage
    return this._layout;
  },

  markups: function() {     // Only relevant for block types which contain text
    return this._markups;
  },

  metadata: function() {    // Only relevant for media at this stage
    return this._metadata;
  },

  isEmpty: function() {
    return this.isText() && this._text == '';
  },

  // ----------------------------------------------
  //  Type Queries
  // ----------------------------------------------

  isParagraph: function() {
    return this._type == this.TYPES.PARAGRAPH;
  },

  isQuote: function() {
    return this._type == this.TYPES.QUOTE;
  },

  isHeading1: function() {
    return this._type == this.TYPES.HEADING1;
  },

  isHeading2: function() {
    return this._type == this.TYPES.HEADING2;
  },

  isHeading3: function() {
    return this._type == this.TYPES.HEADING3;
  },

  isHeading: function() {
    return this.isHeading1() ||
           this.isHeading2() ||
           this.isHeading3();
  },

  isOrderedListItem: function() {
    return this._type == this.TYPES.ORDERED_LIST_ITEM;
  },

  isUnorderedListItem: function() {
    return this._type == this.TYPES.UNORDERED_LIST_ITEM;
  },

  isDivider: function() {
    return this._type == this.TYPES.DIVIDER;
  },

  isImage: function() {
    return this._type == this.TYPES.IMAGE;
  },

  isVideo: function() {
    return this._type == this.TYPES.VIDEO;
  },

  isText: function() {
    return this.isParagraph() ||
           this.isQuote() ||
           this.isHeading1() ||
           this.isHeading2() ||
           this.isHeading3() ||
           this.isOrderedListItem() ||
           this.isUnorderedListItem();
  },

  isMedia: function() {
    return this.isImage() ||
           this.isVideo();
  },

  isListItem: function() {
    return this.isOrderedListItem() ||
           this.isUnorderedListItem();
  },

  // ----------------------------------------------
  //  Mutators
  // ----------------------------------------------

  setType: function(newType, attrs) {
    if (this._type != newType) {
      var newAttrs = {
        type:   newType,
        text:   this._text,
      };
      for (var attrname in attrs) { newAttrs[attrname] = attrs[attrname]; }
      this._setAttributes(newAttrs);
      this.trigger('typechanged');
    }
  },

  setText: function(text) {
    if (this._text != text) {
      this._text = text;
      this.trigger('changed');
    }
  },

  setLayout: function(layout) {
    if (this._layout != layout) {
      this._layout = layout;
      this.trigger('changed');
    }
  },

  addMarkup: function(startOffset, endOffset, type) {

    // On headers, only permit anchors (i.e. not strong or em)
    if (this.isHeading() && !this.isAnchor()) return;

    this._markups.add(new MediumEditor.MarkupModel({ type: type, start: startOffset, end: endOffset }));
    this.trigger('changed');
  },

  setMetadata: function(key, value) {
    if (this._metadata[key] != value) {
      this._metadata[key] = value;
      this.trigger('changed');
    }
  },

  // ----------------------------------------------
  //  Utilities
  // ----------------------------------------------

  // Called by the constructor and by setType. Sets
  // the given attributes (and provides defaults)
  // and nulls any which aren't appropriate for the
  // type (e.g. metadata on a paragraph element)
  _setAttributes: function(attrs) {
    var type = attrs['type'] || 'PARAGRAPH';
    if (typeof type == 'string' || type instanceof String) {
      this._type = this.TYPES[type.toUpperCase()];
    } else {
      this._type = type;
    }
    this._text = this._typeSupportsText() ? (attrs['text'] || '') : null;
    this._layout = this._typeSupportsLayout() ? (attrs['layout'] || '') : null;
    this._markups = this._typeSupportsText() ? new MediumEditor.MarkupCollection() : null;
    this._metadata = this._typeSupportsMetadata() ? (attrs['metadata'] || {}) : null;
  },

  _typeSupportsText: function() {
    return  this._type == this.TYPES.PARAGRAPH ||
            this._type == this.TYPES.QUOTE ||
            this._type == this.TYPES.HEADING1 ||
            this._type == this.TYPES.HEADING2 ||
            this._type == this.TYPES.HEADING3 ||
            this._type == this.TYPES.ORDERED_LIST_ITEM ||
            this._type == this.TYPES.UNORDERED_LIST_ITEM;
  },

  _typeSupportsLayout: function() {
    return  this._type == this.TYPES.QUOTE ||
            this._type == this.TYPES.IMAGE ||
            this._type == this.TYPES.VIDEO;
  },

  _typeSupportsMetadata: function() {
    return  this._type == this.TYPES.IMAGE ||
            this._type == this.TYPES.VIDEO;
  },

});
