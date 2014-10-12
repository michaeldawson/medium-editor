// ---------------------------------------------
//  Block
// ---------------------------------------------

MediumEditor.BlockView = MediumEditor.View.extend({
  init: function(attrs) {
    this._super(attrs);

    // Create the block view element
    this.el = document.createElement(this.model.tag);

    // Listen for changes
    this.on('changed', this.model, this._onChanged.bind(this));

    // Do an initial render
    this._render();
  },

  _onChanged: function() {
    this._render();
  },

  _render: function() {
    this.el.innerHTML = this.model.innerHTML();
  }
});
