// ---------------------------------------------
//  Highlight Menu
// ---------------------------------------------

MediumEditor.HighlightMenuView = MediumEditor.View.extend({

  init: function(attrs) {
    this._super(attrs);
    this.editorEl = attrs['editorEl'];

    // Create the element
    this.el = document.createElement('div');
    this.el.className = 'medium-editor-highlight-menu';
    var arrow = document.createElement('div');
    arrow.className = 'medium-editor-highlight-menu-arrow';
    this.el.appendChild(arrow);

    // Add the buttons
    this.el.appendChild(new MediumEditor.HighlightMenuStrongButtonView({ model: this.model }).el);
    this.el.appendChild(new MediumEditor.HighlightMenuEmphasisButtonView({ model: this.model }).el);
    this.el.appendChild(new MediumEditor.HighlightMenuHeadingButtonView({ model: this.model }).el);
    this.el.appendChild(new MediumEditor.HighlightMenuQuoteButtonView({ model: this.model }).el);
    this.el.appendChild(new MediumEditor.HighlightMenuAnchorButtonView({ model: this.model }).el);

    // Listen to selection changes and show/hide/
    // position accordingly
    this.on('changed', attrs['selection'], this._onSelectionChanged.bind(this));
  },
  _onSelectionChanged: function(selection) {
    this._position(selection);
  },
  _position: function(selection) {
    if (selection.type == 'range') {
      var rect = selection.rectangle;

      // Convert to editor space
      var editorRect = this.editorEl.getBoundingClientRect();
      var top = rect.top - editorRect.top; var bottom = rect.bottom - editorRect.top;
      var left = rect.left - editorRect.left; var right = rect.right - editorRect.left;

      // Measure the highlight menu itself by creating
      // an invisible clone
      var clone = this.el.cloneNode(true);
      clone.style.visibility = 'hidden';
      this.el.parentNode.appendChild(clone);
      clone.className = 'medium-editor-highlight-menu medium-editor-highlight-menu-active';
      var highlightMenuWidth = clone.offsetWidth;
      var highlightMenuHeight = clone.offsetHeight;
      clone.parentNode.removeChild(clone);

      // Calculate x and y
      var x = (right + left - highlightMenuWidth) / 2.0;
      var y = top - highlightMenuHeight + document.body.scrollTop;

      // Clamp to the editor
      x = Math.min(Math.max(x, 0), editorRect.width - highlightMenuWidth);
      y = Math.min(y, editorRect.height - highlightMenuHeight);

      // Set position and make visible
      this.el.style.left = x + 'px';
      this.el.style.top = y + 'px';
      this.el.className = 'medium-editor-highlight-menu medium-editor-highlight-menu-active';
    } else {
      this.el.className = 'medium-editor-highlight-menu';
    }
  }
});
