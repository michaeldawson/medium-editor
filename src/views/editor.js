// ------------------------------------------------
//  Editor
// ------------------------------------------------
//  Contains the actual editable document, along
//  with the highlight menu and inline tooltip.
// ------------------------------------------------

MediumEditor.EditorView = MediumEditor.View.extend({

  // ----------------------------------------------
  //  Constructor
  // ----------------------------------------------

  init: function(attrs) {
    this._super(attrs);

    // Create the editor view element
    this._el = document.createElement('div');
    this._el.className = 'medium-editor';

    // Add a document view as a child
    this._documentView = new MediumEditor.DocumentView({ model: this._model });
    this._el.appendChild(this._documentView._el);
  },

});
