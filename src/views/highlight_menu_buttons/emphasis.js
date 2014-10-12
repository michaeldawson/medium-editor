// ---------------------------------------------
//  Emphasis
// ---------------------------------------------

MediumEditor.HighlightMenuEmphasisButtonView = MediumEditor.HighlightMenuButtonView.extend({
  init: function(attrs) {
    this._super(attrs);
    this.el.innerHTML = '<i class="glyphicon glyphicon-italic"/>';
  },
  _onClick: function(e) {

  }
});
