// ---------------------------------------------
//  Block
// ---------------------------------------------
//  Blocks belong to documents and contain the
//  text, metadata and layout data needed to
//  render them.
// ---------------------------------------------

MediumEditor.BlockModel = MediumEditor.Model.extend({

  // ---------------------------------------------
  //  Supported block types
  // ---------------------------------------------

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

  type: function() {
    return this._type;
  },

  html: function() {

    if (this._isTextType()) {

      // For text types (paragraphs, quotes etc),
      // determine the tag, based on the type
      var tag = {
        MediumEditor.BlockModel.TYPES.PARAGRAPH:            'p',
        MediumEditor.BlockModel.TYPES.QUOTE:                'blockquote',
        MediumEditor.BlockModel.TYPES.HEADING1:             'h2',
        MediumEditor.BlockModel.TYPES.HEADING2:             'h3',
        MediumEditor.BlockModel.TYPES.HEADING3:             'h4',
        MediumEditor.BlockModel.TYPES.ORDERED_LIST_ITEM:    'li',
        MediumEditor.BlockModel.TYPES.UNORDERED_LIST_ITEM:  'li'
      }[this._type];

      // Markup the text
      var innerHTML = this._markups.apply(this._text) || '<br>';

      // Spaces need to be converted to nbsp if
      // they're consecutive, or appear at the
      // beginning or end of the string
      innerHTML = innerHTML.replace(/\s{2}/g,' &nbsp;')     // Consecutive spaces should be compressed to a space + nbsp
                           .replace(/^ /,'&nbsp;')          // Leading spaces should be nbsp
                           .replace(/ $/,'&nbsp;')          // Trailing spaces should be nbsp

      // Create the opening tag. If there's a
      // layout, add it as a class.
      var openingTag = "<" + tag;
      if (this._layout) openingTag += " class='" + this._layout + "'";
      openingTag += ">";

      return openingTag + innerHTML + "</" + tag + ">";

    } else if (this._isMediaType()) {

      // For media types (images and videos),
      // use a figure tag with the media inside

      var innerHTML;
      if (this._type == MediumEditor.BlockModel.TYPES.IMAGE) {
        innerHTML = "<img src='" + this._src + "'>";
      } else {
        innerHTML = "<iframe frameborder='0' allowfullscreen src='" + this._src + "'>";
      }

      // Add the caption (if it exists)
      if (this._caption) {
        innerHTML += "<figcaption>" + this._caption + "</figcaption>";
      }

      // Create the opening tag, adding the
      // layout class if one exists
      var openingTag = "<figure";
      if (this._layout) openingTag += " class='" + this._layout + "'";
      openingTag += ">";

      return openingTag + innerHTML + "</figure>";

    } else if (this._type == MediumEditor.BlockModel.TYPES.DIVIDER) {

      // Divider
      return "<hr>";
    }
  },

  // ---------------------------------------------
  //  Mutators
  // ---------------------------------------------

  setText: function(text) {
    if (this.text != text) {
      this.text = text;
      this.trigger('changed');
    }
  },

  setCaption: function(text) {
    if (this.caption != caption) {
      this.caption = caption;
      this.trigger('changed');
    }
  },

  markup: function(startIx, endIx, type) {

    // Only permit anchor markups on headers
    if (this._isHeading() && type != MediumEditor.Markup.TYPES.ANCHOR) {
      return;
    }

    this.markups.add(new MediumEditor.Markup({ type: type, start: start, end: end }));
    this.trigger('changed');
  },

  changeType: function(newType, attrs) {
    if (this.type != newType) {
      this._setAttributes(attrs);
      this.type = newType;
      this.trigger('typechanged');
    }
  },

  // ---------------------------------------------
  //  Utilities
  // ---------------------------------------------

  // Called by the constructor and changeType().
  // Sets the given attributes (and provides
  // defaults) and nulls any which aren't
  // appropriate for the type (e.g. src on a
  // paragraph element)
  _setAttributes: function(attrs) {
    this._type = MediumEditor.BlockModel.TYPES[attrs['type'].toUpperCase()] || MediumEditor.BlockModel.TYPES.PARAGRAPH;
    this._text = !this._isTextType() ? null : (attrs['text'] || '');
    this._markups = !this._isTextType() ? null : new MediumEditor.MarkupCollection();
    this._src = !this._isMediaType() ? null : (attrs['src'] || '');
    this._caption = !this._isMediaType() ? null : (attrs['caption'] || '');
    this._layout = !this._isMediaType() ? null : (attrs['layout'] || 'standard');
  },

  _isTextType: function() {
    return this._type == MediumEditor.BlockModel.TYPES.PARAGRAPH ||
           this._type == MediumEditor.BlockModel.TYPES.QUOTE ||
           this._type == MediumEditor.BlockModel.TYPES.HEADING1 ||
           this._type == MediumEditor.BlockModel.TYPES.HEADING2 ||
           this._type == MediumEditor.BlockModel.TYPES.HEADING3 ||
           this._type == MediumEditor.BlockModel.TYPES.ORDERED_LIST_ITEM ||
           this._type == MediumEditor.BlockModel.TYPES.UNORDERED_LIST_ITEM;
  },

  _isMediaType: function() {
    return this._type == MediumEditor.BlockModel.TYPES.IMAGE ||
           this._type == MediumEditor.BlockModel.TYPES.VIDEO;
  },

  _isHeading: function() {
    return this._type == MediumEditor.BlockModel.TYPES.HEADING1 ||
           this._type == MediumEditor.BlockModel.TYPES.HEADING2 ||
           this._type == MediumEditor.BlockModel.TYPES.HEADING3;
  }
});
