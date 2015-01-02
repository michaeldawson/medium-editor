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

    // Create the document view element
    this._el = document.createElement('div');
    this._el.className = 'medium-editor-document';
    this._el.contentEditable = true;

    // Create the selection model and view
    this._selection = new MediumEditor.SelectionView({ model: new MediumEditor.SelectionModel({}), documentView: this });

    // Listen for changes to the document model
    this.on('changed', this._model, this._onChanged.bind(this));

    // Listen for key events which may have
    // modified the content and flush the changes
    // through the model.
    this.on('keyup', this._el, this._onKeyUp.bind(this));

    // Perform an initial render
    this._render();
  },

  // ----------------------------------------------
  //  Event Handlers
  // ----------------------------------------------

  _onChanged: function() {
    this._render();
  },

  // Listen for normal editing changes. Let them
  // complete, then flush them through the model
  // change pipeline. Note, we don't use keypress
  // here, even though it handles things like
  // holding down the button nicely, because we
  // also want to deal with backspace and other
  // keys not captured by keypress.
  _onKeyUp: function(e) {
    var text = this._selection.startBlockElement().innerText;
    this._model.setText(text, this._selection.model()._startIx);
  },

  // ----------------------------------------------
  //  Utility Methods
  // ----------------------------------------------

  _render: function() {
    this._selection.restoreAfter((function() {
      this._el.innerHTML = MediumEditor.ModelDOMMapper.toHTML(this._model);
    }).bind(this));
  },

});
