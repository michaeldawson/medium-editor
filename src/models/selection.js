// ---------------------------------------------
//  Selection
// ---------------------------------------------

MediumEditor.SelectionModel = MediumEditor.Model.extend({
  init: function(attrs) {
    this._super(attrs);
    this.document = attrs['document'];
    this._setAttributes(attrs);
  },
  update: function(attrs) {
    if (attrs['startIx'] != this.startIx ||
        attrs['startOffset'] != this.startOffset ||
        attrs['endIx'] != this.endIx ||
        attrs['endOffset'] != this.endOffset) {

          this._setAttributes(attrs);
          this.trigger('changed', this);

    }
  },
  null: function() {
    this.update({});
  },
  _setAttributes: function(attrs) {
    this.startIx = attrs['startIx'];
    this.startOffset = attrs['startOffset'];
    this.endIx = attrs['endIx'];
    this.endOffset = attrs['endOffset'];
    this.rectangle = attrs['rectangle'];
    this._determineType();
    this._determineBlocks();
  },
  _determineType: function() {
    if (this.startIx === undefined) {
      this.type = 'null';
    } else if (this.startIx == this.endIx && this.startOffset == this.endOffset) {
      this.type = 'caret';
    } else {
      this.type = 'range';
    }
  },
  _determineBlocks: function() {
    this.startBlock = this.startIx !== undefined ? this.document.children.at(this.startIx) : null;
    this.endBlock = this.endIx !== undefined ? this.document.children.at(this.endIx) : null;
  }
});
