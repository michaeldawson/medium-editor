// ---------------------------------------------
//  Strong
// ---------------------------------------------

MediumEditor.HighlightMenuStrongButtonView = MediumEditor.HighlightMenuButtonView.extend({
  init: function(attrs) {
    this._super(attrs);
    this.el.innerHTML = '<i class="glyphicon glyphicon-bold"/>';
  },
  _onClick: function(e) {
    var sel = MediumEditor.Selection.create({ documentView: this.editorView.documentView });
    this.model.markup(sel, MediumEditor.StrongModel);
    sel.apply();      // Restore the selection - markup will have killed it because the block re-renders
  }
});
