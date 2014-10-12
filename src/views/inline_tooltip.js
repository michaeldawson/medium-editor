// ---------------------------------------------
//  Inline Tooltip
// ---------------------------------------------

MediumEditor.InlineTooltipView = MediumEditor.View.extend({

  init: function(attrs) {
    this._super(attrs);

    // Create the element
    this.el = document.createElement('div');
    this.el.className = 'medium-editor-inline-tooltip';

    
  }
});
