// ---------------------------------------------
//  Highlight Menu Button
// ---------------------------------------------

MediumEditor.HighlightMenuButtonView = MediumEditor.View.extend({
  init: function(attrs) {
    this._super(attrs);

    // Create the button element
    this.el = document.createElement('button');
    this.el.type = 'button';

    // Listen to clicks
    this.on('click', this.el, this._onClick.bind(this));
  }
});
