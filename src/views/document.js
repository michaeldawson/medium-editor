// ---------------------------------------------
//  Document
// ---------------------------------------------
//  The document view. Doesn't do anything
//  particularly interesting - just creates
//  views for all the blocks and listens for
//  new blocks being created.
// ---------------------------------------------

MediumEditor.DocumentView = MediumEditor.View.extend({

  // ---------------------------------------------
  //  Constructor
  // ---------------------------------------------

  init: function(attrs) {
    this._super(attrs);

    // Create the document view element
    this._el = document.createElement('div');
    this._el.className = 'medium-editor-document';
    this._el.contentEditable = true;

    // Listen for changes to the document
    this.on('changed', this._model, this._onChanged.bind(this));

    // Perform an initial render
    this._render();
  },

  // ---------------------------------------------
  //  Event Handlers
  // ---------------------------------------------

  _onChanged: function() {
    this._render();
  },

  // ---------------------------------------------
  //  Utility Methods
  // ---------------------------------------------

  _render: function() {
    this._el.innerHTML = this._model.html();
  }
});
