// ------------------------------------------------
//  Highlight Menu
// ------------------------------------------------
//  Appears over the top of highlighted text and
//  media objects. Allows markups and formatting
//  changes.
// ------------------------------------------------

MediumEditor.HighlightMenuView = MediumEditor.View.extend({

  // ----------------------------------------------
  //  Constructor
  // ----------------------------------------------

  init: function(attrs) {
    this._super(attrs);
    this._editor = attrs['editor'];

    // Create the document view element
    this._el = document.createElement('div');
    this._el.className = 'medium-editor-highlight-menu';

    // Listen for changes to the selection - if it
    // changes to a range, show and position,
    // otherwise hide.
    this.on('changed', this._selection().model(), this._onSelectionChanged.bind(this));

    // Perform an initial render
    this._render();

    // Perform an initial render
    this._render();
  },

  // ----------------------------------------------
  //  Event Handlers
  // ----------------------------------------------

  _onSelectionChanged: function() {
    var selectionModel = this._selection().model();
    if (selectionModel.isRange()) {
      this._showAndPosition();
    } else {
      this._hide();
    }
  },

  // ----------------------------------------------
  //  Utility Methods
  // ----------------------------------------------

  _render: function() {
    this._el.innerHTML = 'foobar';
  },

  _showAndPosition: function() {
    var rectangle = this._selection().rectangle();
    this._el.style.top = rectangle.top + 'px';
    this._el.style.left = rectangle.left + 'px';
    this._el.className = 'medium-editor-highlight-menu medium-editor-highlight-menu-active';
  },

  _hide: function() {
    this._el.className = 'medium-editor-highlight-menu';
  },

  // Shorthand
  _selection: function() {
    return this._editor.selection();
  },

});
