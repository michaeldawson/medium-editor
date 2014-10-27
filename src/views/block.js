// ---------------------------------------------
//  Block
// ---------------------------------------------

MediumEditor.BlockView = MediumEditor.View.extend({

  init: function(attrs) {
    this._super(attrs);

    // Create the block view element
    this.el = this._createElement();

    // Listen for changes
    this.on('changed', this.model, this._onChanged.bind(this));
    this.on('typechanged', this.model, this._onTypeChanged.bind(this));
  },

  _createElement: function() {
    var el = document.createElement('div');
    el.innerHTML = this.model.html();
    el = el.firstChild;
    if (this.model.type() == MediumEditor.BlockModel.prototype.TYPES.IMAGE ||
        this.model.type() == MediumEditor.BlockModel.prototype.TYPES.VIDEO ||
        this.model.type() == MediumEditor.BlockModel.prototype.TYPES.DIVIDER) {
        el.contentEditable = false;
    }
    return el;
  },

  _onChanged: function() {
    this._render();
  },

  _render: function() {
    this.el.innerHTML = this.model.innerHTML();
  },

  _onTypeChanged: function() {
    var newEl = this._createElement();
    this.el.parentNode.replaceChild(newEl, this.el);
  }
});
