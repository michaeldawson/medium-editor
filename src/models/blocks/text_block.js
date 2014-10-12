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
    var markedUp = this.markups.apply(this.text) || '<br>';
    markedUp = markedUp.replace(/\s{2}/g,' &nbsp;')     // Consecutive spaces should be compressed to a space + nbsp
                       .replace(/^ /,'&nbsp;')          // Leading spaces should be nbsp
                       .replace(/ $/,'&nbsp;')          // Trailing spaces should be nbsp
    return markedUp;
  },
  html: function() {
    return '<' + this.tag + '>' + this.innerHTML() + '</' + this.tag + '>';
  },
  _onMarkupAdded: function() {
    this.trigger('changed');
  },
  setText: function(text) {
    if (this.text != text) {
      this.text = text;
      this.trigger('changed');
    }
  }
});
