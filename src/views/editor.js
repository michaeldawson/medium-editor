// ---------------------------------------------
//  Editor
// ---------------------------------------------
//  Contains the actual editable document,
//  along with the highlight menu and inline
//  tooltip.
// ---------------------------------------------

MediumEditor.EditorView = MediumEditor.View.extend({
  init: function(attrs) {
    this._super(attrs);

    // Create the editor view element
    this.el = document.createElement('div');
    this.el.className = 'medium-editor';

    // Add a document view as a child
    this.documentView = new MediumEditor.DocumentView({ model: this.model });
    this.el.appendChild(this.documentView.el);

    // Create the highlight menu
    this.highlightMenuView = new MediumEditor.HighlightMenuView({ model: this.model, editorView: this });
    this.el.appendChild(this.highlightMenuView.el);

    // Create the inline tooltip
    this.inlineTooltipView = new MediumEditor.InlineTooltipView({ model: this.model, editorView: this });
    this.el.appendChild(this.inlineTooltipView.el);
  }
});
