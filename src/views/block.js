// ---------------------------------------------
//  Block
// ---------------------------------------------

MediumEditor.BlockView = MediumEditor.View.extend({
  init: function(attrs) {
    this._super(attrs);

    // Create the block view element
    this.el = document.createElement(this.model.tag());

    // Listen for changes
    this.on('changed', this.model, this._onChanged.bind(this));
    this.on('typechanged', this.model, this._onTypeChanged.bind(this));

    // Do an initial render
    this._render();
  },

  _onChanged: function() {
    this._render();
  },

  _render: function() {
    this.el.innerHTML = this.model.innerHTML();
  },

  _onTypeChanged: function() {
    var newEl = document.createElement(this.model.tag());
    newEl.innerHTML = this.model.innerHTML();
    this.el.parentNode.replaceChild(newEl, this.el);
  }
});
