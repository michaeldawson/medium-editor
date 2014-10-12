// ---------------------------------------------
//  Heading
// ---------------------------------------------

MediumEditor.HighlightMenuHeadingButtonView = MediumEditor.HighlightMenuButtonView.extend({
  init: function(attrs) {
    this._super(attrs);
    this.el.innerHTML = '<i class="glyphicon glyphicon-header"/>';
  },
  _onClick: function(e) {

  }
});
