// ---------------------------------------------
//  Block
// ---------------------------------------------
//  Blocks belong to documents and contain the
//  text, metadata and layout data needed to
//  render them.
// ---------------------------------------------

MediumEditor.BlockModel = MediumEditor.Model.extend({

  // ---------------------------------------------
  //  Block Types
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

  // Returns the inner HTML of the block as a
  // string. This is separated from the `html`
  // method because when re-rendering views upon
  // content change, we only want the inner HTML.
  innerHTML: function() {

    if (this.isText()) {

      // Paragraph, heading, quote etc. Markup the
      // text
      var innerHTML = this._markups.apply(this._text) || '<br>';

      // Spaces need to be converted to nbsp if
      // they're consecutive, or appear at the
      // beginning or end of the string
      return innerHTML.replace(/\s{2}/g,' &nbsp;')     // Consecutive spaces should be compressed to a space + nbsp
                      .replace(/^ /,'&nbsp;')          // Leading spaces should be nbsp
                      .replace(/ $/,'&nbsp;')          // Trailing spaces should be nbsp

    } else if (this.isMedia()) {

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

    // Wrap the inner HTML
    var tag;
    switch(this._type) {
      case this.TYPES.PARAGRAPH:             tag = 'p'; break;
      case this.TYPES.QUOTE:                 tag = 'blockquote'; break;
      case this.TYPES.HEADING1:              tag = 'h2'; break;
      case this.TYPES.HEADING2:              tag = 'h3'; break;
      case this.TYPES.HEADING3:              tag = 'h4'; break;
      case this.TYPES.IMAGE:                 tag = 'figure'; break;
      case this.TYPES.VIDEO:                 tag = 'figure'; break;
      case this.TYPES.ORDERED_LIST_ITEM:     tag = 'li'; break;
      case this.TYPES.UNORDERED_LIST_ITEM:   tag = 'li'; break;
      case this.TYPES.DIVIDER:               tag = 'hr'; break;
    }

    var openingTag = "<" + tag + ">";
    var closingTag = this.isDivider() ? '' : "</" + tag + ">";
    var html = openingTag + this.innerHTML() + closingTag;
    return html;
  },

  text: function() {
    return this._text;
  },

  type: function() {
    return this._type;
  },

  layout: function() {
    return this._layout;
  },

  isText: function() {
    return this._type == this.TYPES.PARAGRAPH ||
           this._type == this.TYPES.QUOTE ||
           this._type == this.TYPES.HEADING1 ||
           this._type == this.TYPES.HEADING2 ||
           this._type == this.TYPES.HEADING3 ||
           this._type == this.TYPES.ORDERED_LIST_ITEM ||
           this._type == this.TYPES.UNORDERED_LIST_ITEM;
  },

  isMedia: function() {
    return this._type == this.TYPES.IMAGE ||
           this._type == this.TYPES.VIDEO;
  },

  isHeading: function() {
    return this._type == this.TYPES.HEADING1 ||
           this._type == this.TYPES.HEADING2 ||
           this._type == this.TYPES.HEADING3;
  },

  isQuote: function() {
    return this._type == this.TYPES.QUOTE;
  },

  isDivider: function() {
    return this._type == this.TYPES.DIVIDER;
  },

  isParagraph: function() {
    return this._type == this.TYPES.PARAGRAPH;
  },

  isListItem: function() {
    return this._type == this.TYPES.ORDERED_LIST_ITEM ||
           this._type == this.TYPES.UNORDERED_LIST_ITEM;
  },

  isOrderedListItem: function() {
    return this._type == this.TYPES.ORDERED_LIST_ITEM;
  },

  isUnorderedListItem: function() {
    return this._type == this.TYPES.UNORDERED_LIST_ITEM;
  },

  // ---------------------------------------------
  //  Mutators
  // ---------------------------------------------

  setText: function(text) {
    if (this._text != text) {
      this._text = text;
      this.trigger('changed');
    }
  },

  markup: function(startIx, endIx, type) {

    // Only permit anchor markups on headers
    if (this.isHeading() && !this.isAnchor()) return

    this.markups.add(new MediumEditor.Markup({ type: type, start: start, end: end }));
    this.trigger('changed');
  },

  changeType: function(newType, attrs) {
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

  // ---------------------------------------------
  //  Utilities
  // ---------------------------------------------

  // Called by the constructor and changeType().
  // Sets the given attributes (and provides
  // defaults) and nulls any which aren't
  // appropriate for the type (e.g. src on a
  // paragraph element)
  _setAttributes: function(attrs) {
    if (attrs.hasOwnProperty('html')) {
      this._parse(attrs['html']);
    } else {
      this._type = this.TYPES[(attrs['type'] || 'PARAGRAPH').toUpperCase()];
      this._text = !this.isText() ? null : ((this.isListItem() ? '' : attrs['text']) || '');
      this._markups = !this.isText() ? null : new MediumEditor.MarkupCollection();
      this._src = !this.isMedia() ? null : (attrs['src'] || '');
      this._caption = !this.isMedia() ? null : (attrs['caption'] || '');
      this._layout = !this.isMedia() && !this.isQuote() ? '' : (attrs['layout'] || '');
    }
  },

  // Parse a HTML string and determine type,
  // content and markup.
  _parse: function(htmlStr) {

    // Create a DOM representation of the string
    var el = document.createElement('div');
    el.innerHTML = (htmlStr || '').trim();
    el = el.firstChild;

    // Determine the type from the tag name
    var attrs = { text: el.innerText };
    var tagName = el.tagName.toLowerCase();
    switch(tagName) {
      case 'p':           attrs['type'] = 'PARAGRAPH'; break;
      case 'blockquote':  attrs['type'] = 'QUOTE'; break;
      case 'h2':          attrs['type'] = 'HEADING1'; break;
      case 'h3':          attrs['type'] = 'HEADING2'; break;
      case 'h4':          attrs['type'] = 'HEADING3'; break;
      case 'hr':          attrs['type'] = 'DIVIDER'; break;
      case 'figure':
        attrs['type'] = el.children[0].tagName.toLowerCase() == 'img' ? 'IMAGE' : 'VIDEO';
        attrs['src'] = el.children[0].src;
        if (el.children.length > 1) attrs['caption'] = el.children[1].innerText;
        break;
      case 'li':
        // TODO
        break;
    }

    // TODO - interpret markups and layouts too

    // Set the attributes
    this._setAttributes(attrs);
  }
});
