// ------------------------------------------------
//  Document
// ------------------------------------------------
//  The document view.
// ------------------------------------------------

MediumEditor.DocumentView = MediumEditor.View.extend({

  // ----------------------------------------------
  //  Constructor
  // ----------------------------------------------

  init: function(attrs) {
    this._super(attrs);
    this._editor = attrs['editor'];

    // Create the document view element
    this._el = document.createElement('div');
    this._el.className = 'medium-editor-document';
    this._el.contentEditable = true;

    // Listen for changes to the document model
    this.on('changed', this._model, this._onChanged.bind(this));

    // Perform an initial render
    this._render();
  },

  // ----------------------------------------------
  //  Event Handlers
  // ----------------------------------------------

  _onChanged: function() {
    this._render();
    this._editor.selection().setOnBrowser();  // Put the selection back
  },

  // ----------------------------------------------
  //  Utility Methods
  // ----------------------------------------------

  _render: function() {
    this._el.innerHTML = MediumEditor.ModelDOMMapper.toHTML(this._model);
  },

});
