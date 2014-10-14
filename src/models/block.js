// ---------------------------------------------
//  Block
// ---------------------------------------------
//  Abstract. Blocks belong to documents and
//  contain the text and/or metadata needed to
//  render them.
// ---------------------------------------------

MediumEditor.BlockModel = MediumEditor.Model.extend({
  init: function(attrs) {
    this._super(attrs);
    this.parent = attrs['parent'];       // Refers to the document model this block belongs to
    this.type = attrs['type'] || 'paragraph';
    this.text = attrs['text'] || '';
    this.markups = new MediumEditor.MarkupCollection();
    this.on('add', this.markups, this._onMarkupAdded.bind(this));
  },
  _onMarkupAdded: function() {
    this.trigger('changed');
  },
  setText: function(text) {
    if (this.text != text) {
      this.text = text;
      this.trigger('changed');
    }
  },
  changeType: function(newType) {
    if (this.type == newType) return;
    this.markups.clear();
    if (newType != 'paragraph' && newType != 'quote' && newType != 'heading') {
      this.text = '';
    }
    this.type = newType;
    this.trigger('typechanged');
  },
  tag: function() {
    switch(this.type) {
      case 'paragraph': return 'p';
      case 'heading': return 'h3';
      case 'quote': return 'blockquote';
      case 'divider': return 'hr';
      case 'unordered_list': return 'ul';
      case 'ordered_list': return 'ol';
      case 'image': return 'img';
      case 'video': return 'video';
    }
  },
  innerHTML: function() {
    var toReturn = this.markups.apply(this.text) || '<br>';
    toReturn = toReturn.replace(/\s{2}/g,' &nbsp;')     // Consecutive spaces should be compressed to a space + nbsp
                       .replace(/^ /,'&nbsp;')          // Leading spaces should be nbsp
                       .replace(/ $/,'&nbsp;')          // Trailing spaces should be nbsp
    if (this.type == 'ordered_list' || this.type == 'unordered_list') {
      var items = toReturn.split("\n");
      toReturn = '';
      for(var i = 0; i < items.length; i++) {
        toReturn += '<li>' + items[i] + '</li>'
      }
    }
    return toReturn;
  },
  html: function() {
    return '<' + this.tag() + '>' + this.innerHTML() + '</' + this.tag() + '>';
  }
});
