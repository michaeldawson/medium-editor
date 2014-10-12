// ---------------------------------------------
//  Quote
// ---------------------------------------------

MediumEditor.HighlightMenuQuoteButtonView = MediumEditor.HighlightMenuButtonView.extend({
  init: function(attrs) {
    this._super(attrs);
    this.el.innerHTML = '<i class="fa fa-quote-right"/>';
  },
  _onClick: function(e) {

  }
});
