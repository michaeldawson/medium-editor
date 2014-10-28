// ---------------------------------------------
//  Block
// ---------------------------------------------
//  A view representing a block. Doesn't do
//  anything interesting - just listens to
//  changes in its model and renders them.
// ---------------------------------------------

MediumEditor.BlockView = MediumEditor.View.extend({

  // ---------------------------------------------
  //  Constructor
  // ---------------------------------------------

  init: function(attrs) {
    this._super(attrs);

    // Create the block view element
    this._el = this._createElement();

    // Listen for changes
    this.on('changed', this._model, this._onChanged.bind(this));
    this.on('typechanged', this._model, this._onTypeChanged.bind(this));
  },

  // ---------------------------------------------
  //  Event Handlers
  // ---------------------------------------------

  _onChanged: function() {
    this._render();
  },

  _onTypeChanged: function() {

    // The type of the block changed, so create a
    // whole new element and replace the current
    // element with it
    var newEl = this._createElement();
    this._el.parentNode.replaceChild(newEl, this._el);
  },

  // ---------------------------------------------
  //  Utility Methods
  // ---------------------------------------------

  _createElement: function() {

    // The model gives us a HTML string, so create
    // a DOM representation of that
    var el = document.createElement('div');
    el.innerHTML = this._model.html();
    el = el.firstChild;

    // If this is an image, a video or a divider,
    // disable content editing
    if (this._model.isMedia() || this._model.isDivider()) {
      el.contentEditable = false;
    }

    return el;
  },

  // Update the contents of the element
  _render: function() {
    this._el.innerHTML = this._model.innerHTML();
  }

});
