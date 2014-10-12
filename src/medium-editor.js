// ---------------------------------------------
//  Medium Editor 1.0.0
// ---------------------------------------------
//  (c) 2014 Cameron Price-Austin
//  May be freely distributed under the MIT
//  license.
// ---------------------------------------------

MediumEditor.prototype = {

  // Constructor - ensure the platform is supported,
  // then setup the element, models and views.
  init: function(selector, options) {

    // Ensure we can support this browser/device
    if (!this._supportedPlatform()) return false;

    // Find the element - note we don't support
    // multiple elements at this time
    this.el = document.querySelector(selector);
    if (!this.el) return false;
    this.el.style.display = 'none';

    // Create the model
    var startingHTML = this.el.innerHTML || '';
    this.documentModel = new MediumEditor.DocumentModel({ html: startingHTML });

    // Create the editor view and insert it into
    // the page before the given element
    this.editorView = new MediumEditor.EditorView({ model: this.documentModel });
    this.el.parentNode.insertBefore(this.editorView.el, this.el);
  },

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
