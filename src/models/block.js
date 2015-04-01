// ------------------------------------------------
//  Block
// ------------------------------------------------
//  Blocks belong to documents and represent the
//  semantic components within, such as paragraphs,
//  list items, images etc. They contain text,
//  markups, metadata and layout settings.
//  Currently supported types:
//
//    PARAGRAPH
//    QUOTE
//    HEADING1
//    HEADING2
//    HEADING3
//    ORDERED_LIST_ITEM
//    UNORDERED_LIST_ITEM
//    DIVIDER
//    IMAGE
//    VIDEO
// ------------------------------------------------

MediumEditor.BlockModel = MediumEditor.Model.extend({

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

  isParagraph: function() {
    return this._type == 'PARAGRAPH';
  },

  isQuote: function() {
    return this._type == 'QUOTE';
  },

  isHeading1: function() {
    return this._type == 'HEADING1';
  },

  isHeading2: function() {
    return this._type == 'HEADING2';
  },

  isHeading3: function() {
    return this._type == 'HEADING3';
  },

  isHeading: function() {
    return this.isHeading1() ||
           this.isHeading2() ||
           this.isHeading3();
  },

  isOrderedListItem: function() {
    return this._type == 'ORDERED_LIST_ITEM';
  },

  isUnorderedListItem: function() {
    return this._type == 'UNORDERED_LIST_ITEM';
  },

  isDivider: function() {
    return this._type == 'DIVIDER';
  },

  isImage: function() {
    return this._type == 'IMAGE';
  },

  isVideo: function() {
    return this._type == 'VIDEO';
  },

  isText: function() {
    return this.isParagraph() ||
           this.isQuote() ||
           this.isHeading() ||
           this.isListItem();
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

  supportsMarkupType: function(markupType) {
    switch(markupType) {
      case 'STRONG':
      case 'EMPHASIS':
        return this.isText() && !this.isHeading();
      case 'ANCHOR':
        return this.isText();
    }
  },

  supportsLayout: function() {
    return this.isMedia() || this.isQuote();
  },

  supportsMetadata: function() {
    return this.isMedia();
  },

  // Return true if every character within the
  // given offset range is marked up with the given
  // type
  isRangeMarkedUpAs: function(type, startOffset, endOffset) {
    return this._markups && this._markups.isRangeMarkedUpAs(type, startOffset, endOffset);
  },

  // ----------------------------------------------
  //  Mutators
  // ----------------------------------------------

  setType: function(newType, attrs, options) {
    if (this._type != newType) {
      var newAttrs = {
        type:   newType,
        text:   this._text,
      };
      for (var attrname in attrs) { newAttrs[attrname] = attrs[attrname]; }
      this._setAttributes(newAttrs);
      if (!options || !options['silent']) this.trigger('changed');
    }
  },

  setText: function(text) {
    if (this._text != text) {
      this._shiftMarkupOffsets(text);
      this._text = text;
      this.trigger('changed');
    }
  },

  setLayout: function(layout, options) {
    if (this._layout != layout) {
      this._layout = layout;
      if (!options || !options['silent']) this.trigger('changed');
    }
  },

  // Marks up text in the given range with the
  // given type. Or, if the entire range is already
  // marked up in the type, unmarks it.
  markup: function(startOffset, endOffset, type, options) {
    if (!this.supportsMarkupType(type)) return;

    // The `MediumEditor.MarkupCollection.add`
    // method takes care of this behaviour
    this._markups.add(new MediumEditor.MarkupModel({ type: type, start: startOffset, end: endOffset }));
    if (!options || !options['silent']) this.trigger('changed');
  },

  setMetadata: function(key, value) {
    if (this._metadata[key] != value) {
      this._metadata[key] = value;
      this.trigger('changed');
    }
  },

  // Called by the constructor and by setType. Sets
  // the given attributes (and provides defaults)
  // and nulls any which aren't appropriate for the
  // type (e.g. metadata on a paragraph element)
  _setAttributes: function(attrs) {
    this._type = attrs['type'] || 'PARAGRAPH';
    this._text = this.isText() ? (attrs['text'] || '') : null;
    this._layout = this.supportsLayout() ? (attrs['layout'] || 'SINGLE-COLUMN') : 'SINGLE-COLUMN';
    this._markups = this.isText() ? new MediumEditor.MarkupCollection() : null;
    this._metadata = this.supportsMetadata() ? (attrs['metadata'] || {}) : null;
  },

  // When text changes in a block, we need to
  // modify the markup offsets. For example, if we
  // remove a character from index 3 and we have a
  // markup from offset 7 to offset 15, those
  // indices need to be reduced by one. We use a
  // text diff algorithm for determining how many
  // characters were added/removed and from where.
  _shiftMarkupOffsets: function(newText) {

    if (this._markups.size() == 0) return;  // Quick exit

    // Will return an object in the form
    // { type: 'add', start: 3, added: 1, removed: 2 }
    // where type is add, remove, replace or none.
    var difference = MediumEditor.Util.diff(this._text, newText);

    if (difference.type == 'none') return;  // No change

    // If we're removing or replacing (which we
    // implement as simply removing then adding),
    // every offset greater than the start gets
    // shifted backward by the number of characters
    // removed (clamped to the start index)
    if (difference.type == 'remove' || difference.type == 'replace') {

      for(var i = 0; i < this._markups.size(); i++) {
        var markup = this._markups.at(i);
        if (markup.start() > difference.start) {
          markup.setStart(Math.max(difference.start, markup.start() - difference.removed), { silent: true });
        }
        if (markup.end() > difference.start) {
          markup.setEnd(Math.max(difference.start, markup.end() - difference.removed), { silent: true });
        }
        if (markup.start() == markup.end()) {
          this._markups.removeAt(i);
          i--;
        }
      }
    }

    // If we're adding or replacing, every offset
    // greater than or equal to the start gets
    // shifted forward by the number of characters
    // added
    if (difference.type == 'add' || difference.type == 'replace') {

      for(var i = 0; i < this._markups.size(); i++) {
        var markup = this._markups.at(i);
        if (markup.start() >= difference.start) {
          markup.setStart(Math.max(difference.start, markup.start() + difference.added), { silent: true });
        }
        if (markup.end() >= difference.start) {
          markup.setEnd(Math.max(difference.start, markup.end() + difference.added), { silent: true });
        }
      }
    }
  }
});
