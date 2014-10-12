// ---------------------------------------------
//  Text Block
// ---------------------------------------------
//  Abstract. Just to DRY up all the common
//  elements of blocks which contain text
//  (paragraph, quote and heading).
// ---------------------------------------------

MediumEditor.TextBlockModel = MediumEditor.Model.extend({
  init: function(attrs) {
    this._super(attrs);
    this.text = (attrs || {})['text'] || '';
    this.markups = new MediumEditor.MarkupCollection();
    this.on('add', this.markups, this._onMarkupAdded.bind(this));
  },
  innerHTML: function() {
    return this.markups.apply(this.text) || '<br>';
  },
  html: function() {
    return '<' + this.tag + '>' + this.innerHTML() + '</' + this.tag + '>';
  },
  _onMarkupAdded: function() {
    this.trigger('changed');
  }
});
