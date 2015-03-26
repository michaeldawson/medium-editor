// ------------------------------------------------
//  Medium Editor 1.0.0
// ------------------------------------------------
//  (c) 2015 Cameron Price-Austin
//  May be freely distributed under the MIT
//  license.
// ------------------------------------------------

MediumEditor.prototype = {

  // ----------------------------------------------
  //  Constructor
  // ----------------------------------------------
  //  Ensure the platform is supported, then setup
  //  the element, models and views.
  // ----------------------------------------------

  init: function(selector_or_element, options) {

    // Ensure we can support this browser/device
    if (!this._supportedPlatform()) return false;

    // Find the element - note we don't support
    // multiple elements at this time
    if (typeof selector_or_element == 'string' || selector_or_element instanceof String) {
      this._el = document.querySelector(selector_or_element);
    } else {
      this._el = selector_or_element;
    }
    if (!this._el) return false;
    this._el.style.display = 'none';

    // Determine the starting HTML
    var startingHTML = '';
    if (this._el.tagName.toLowerCase() == 'textarea') {
      startingHTML = this._el.value;
    } else {
      startingHTML = this._el.innerHTML;
    }

    // Create the model
    this._documentModel = new MediumEditor.DocumentModel({ html: startingHTML });

    // Create the editor view and insert it into
    // the page before the given element
    this._editorView = new MediumEditor.EditorView({ model: this._documentModel });
    this._el.parentNode.insertBefore(this._editorView._el, this._el);
  },

  // ----------------------------------------------
  //  Utilities
  // ----------------------------------------------

  // Check if the browser/device combination is
  // supported. We need querySelector and
  // contentEditable support.
  _supportedPlatform: function() {
    return this._querySelectorSupported() && this._contentEditableSupported();
  },

  // Detects support for querySelector.
  // Source: https://github.com/Modernizr/Modernizr/blob/master/feature-detects/queryselector.js
  _querySelectorSupported: function() {
    return 'querySelector' in document && 'querySelectorAll' in document;
  },

  // Detects support for the `contenteditable`
  // attribute.
  // Source: https://github.com/Modernizr/Modernizr/blob/master/feature-detects/contenteditable.js
  _contentEditableSupported: function() {

    // early bail out
    if (!('contentEditable' in document.body)) return false;

    // some mobile browsers (android < 3.0, iOS < 5) claim to support
    // contentEditable, but but don't really. This test checks to see
    // confirms wether or not it actually supports it.

    var div = document.createElement('div');
    div.contentEditable = true;
    return div.contentEditable === 'true';
  },
};
