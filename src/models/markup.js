// ---------------------------------------------
//  Markup
// ---------------------------------------------
//  Abstract. Markup can describe formatting
//  (such as strong or emphasis), or links.
//  They have start and end values, which
//  correspond to the start and end character
//  indices of the text in the parent block to
//  which they apply.
// ---------------------------------------------

MediumEditor.MarkupModel = MediumEditor.Model.extend({
  init: function(attrs) {
    this._super(attrs);
    this.start = attrs['start'] || 0;
    this.end = attrs['end'] || 0;
    if (this.start > this.end) {
      var temp = this.end;
      this.end = this.start;
      this.start = temp;
    } else if (this.start == this.end) {
      throw 'Start and end points of markup must be separate';
    }
  },
  touches: function(other) {
    return this.start <= other.end && this.end >= other.start;
  },
  covers: function(other) {
    return this.start <= other.start && this.end >= other.end;
  },
  openingTag: function() {
    return '<' + this.tag + '>';
  },
  closingTag: function() {
    return '</' + this.tag + '>';
  }
});
