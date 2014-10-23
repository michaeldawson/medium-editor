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
  //  Arguably heading could be done as a single
  //  type, with the subtypes achieved as layouts,
  //  but unlike other uses for layouts
  //  (pullquotes, full-width images etc.),
  //  different levels of headings are different
  //  semantically.
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

  // Returns the inner HTML of the block as a
  // string. This is separated from the `html`
  // method because when re-rendering views upon
  // content change, we only want the inner HTML.
  innerHTML: function() {

    if (this._isTextType()) {

      // Paragraph, heading, quote etc. Markup the
      // text
      var innerHTML = this._markups.apply(this._text) || '<br>';

      // Spaces need to be converted to nbsp if
      // they're consecutive, or appear at the
      // beginning or end of the string
      return innerHTML.replace(/\s{2}/g,' &nbsp;')     // Consecutive spaces should be compressed to a space + nbsp
                      .replace(/^ /,'&nbsp;')          // Leading spaces should be nbsp
                      .replace(/ $/,'&nbsp;')          // Trailing spaces should be nbsp

    } else if (this._isMediaType()) {

      // Images or videos. The actual img or iframe
      // element will be nested within a figure.
      var innerHTML;
      if (this._type == this.TYPES.IMAGE) {
        innerHTML = "<img src='" + this._src + "'>";
      } else {
        innerHTML = "<iframe frameborder='0' allowfullscreen src='" + this._src + "'>";
      }

      // Add the caption (if it exists)
      if (this._caption) {
        innerHTML += "<figcaption>" + this._caption + "</figcaption>";
      }

      return innerHTML;

    } else {

      // Divider - has no inner HTML
      return null;
    }
  },

  // Return the full HTML of the block.
  html: function() {

    if (this._isTextType()) {

      // For text types (paragraphs, quotes etc),
      // determine the tag, based on the type
      var tag;
      switch(this._type) {
        case this.TYPES.PARAGRAPH:             tag = 'p'; break;
        case this.TYPES.QUOTE:                 tag = 'blockquote'; break;
        case this.TYPES.HEADING1:              tag = 'h2'; break;
        case this.TYPES.HEADING2:              tag = 'h3'; break;
        case this.TYPES.HEADING3:              tag = 'h4'; break;
        case this.TYPES.ORDERED_LIST_ITEM:     tag = 'li'; break;
        case this.TYPES.UNORDERED_LIST_ITEM:   tag = 'li'; break;
      }

      // Create the opening tag. If there's a
      // layout, add it as a class.
      var openingTag = "<" + tag;
      if (this._layout) openingTag += " class='" + this._layout + "'";
      openingTag += ">";

      return openingTag + this.innerHTML() + "</" + tag + ">";

    } else if (this._isMediaType()) {

      // Create the opening tag, adding the
      // layout class if one exists.
      var openingTag = "<figure";
      if (this._layout) openingTag += " class='" + this._layout + "'";
      openingTag += ">";

      return openingTag + this.innerHTML() + "</figure>";

    } else if (this._type == this.TYPES.DIVIDER) {

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
    if (this._isHeading() && type != MediumEditor.Markup.TYPES.ANCHOR) return

    this.markups.add(new MediumEditor.Markup({ type: type, start: start, end: end }));
    this.trigger('changed');
  },

  changeType: function(newType, attrs) {
    if (this._type != newType) {
      this._setAttributes(attrs);
      this._type = newType;
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
    this._type = this.TYPES[(attrs['type'] || 'PARAGRAPH').toUpperCase()];
    this._text = !this._isTextType() ? null : (attrs['text'] || '');
    this._markups = !this._isTextType() ? null : new MediumEditor.MarkupCollection();
    this._src = !this._isMediaType() ? null : (attrs['src'] || '');
    this._caption = !this._isMediaType() ? null : (attrs['caption'] || '');
    this._layout = !this._isMediaType() ? null : (attrs['layout'] || '');
  },

  _isTextType: function() {
    return this._type == this.TYPES.PARAGRAPH ||
           this._type == this.TYPES.QUOTE ||
           this._type == this.TYPES.HEADING1 ||
           this._type == this.TYPES.HEADING2 ||
           this._type == this.TYPES.HEADING3 ||
           this._type == this.TYPES.ORDERED_LIST_ITEM ||
           this._type == this.TYPES.UNORDERED_LIST_ITEM;
  },

  _isMediaType: function() {
    return this._type == this.TYPES.IMAGE ||
           this._type == this.TYPES.VIDEO;
  },

  _isHeading: function() {
    return this._type == this.TYPES.HEADING1 ||
           this._type == this.TYPES.HEADING2 ||
           this._type == this.TYPES.HEADING3;
  }
});
