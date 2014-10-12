// ---------------------------------------------
//  Anchor
// ---------------------------------------------

MediumEditor.HighlightMenuAnchorButtonView = MediumEditor.HighlightMenuButtonView.extend({
  init: function(attrs) {
    this._super(attrs);
    this.el.innerHTML = '<i class="glyphicon glyphicon-link"/>';
  },
  _onClick: function(e) {

  }
});
