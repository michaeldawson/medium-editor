// ---------------------------------------------
//  Highlight Menu
// ---------------------------------------------

MediumEditor.HighlightMenuView = MediumEditor.View.extend({

  BUTTONS: {
    'strong':         '<i class="fa fa-bold"></i>',
    'emphasis':       '<i class="fa fa-italic"></i>',
    'h1':             'H1',
    'h2':             'H2',
    'h3':             'H3',
    'quote':          '<i class="fa fa-quote-right"></i>',
    'anchor':         '<i class="fa fa-link"></i>'
  },

  init: function(attrs) {
    this._super(attrs);
    this.selection = attrs['selection'];

    // Create the element
    this.el = document.createElement('div');
    this.el.className = 'medium-editor-highlight-menu';
    var arrow = document.createElement('div');
    arrow.className = 'medium-editor-highlight-menu-arrow';
    this.el.appendChild(arrow);

    // Create buttons
    for (var action in this.BUTTONS) {
      if (this.BUTTONS.hasOwnProperty(action)) {
        var html = this.BUTTONS[action];
        var button = document.createElement('button');
        button.type = 'button';
        button.innerHTML = html;
        button.setAttribute('data-action', action);
        this.on('mousedown touchstart', button, this._onButton.bind(this));
        this.el.appendChild(button);
      }
    }

    // Listen to selection changes and show/hide/
    // position accordingly
    this.on('changed', this.selection, this._onSelectionChanged.bind(this));
  },
  _onButton: function(e) {
    var action = e.currentTarget.getAttribute('data-action');
    switch(action) {
      case 'strong':
        this.selection.markup(MediumEditor.MarkupModel.prototype.TYPES.STRONG);
        break;
      case 'emphasis':
        this.selection.markup(MediumEditor.MarkupModel.prototype.TYPES.EMPHASIS);
        break;
      case 'h1':
        this.selection.changeBlockType(MediumEditor.BlockModel.prototype.TYPES.HEADING1);
        break;
      case 'h2':
        this.selection.changeBlockType(MediumEditor.BlockModel.prototype.TYPES.HEADING2);
        break;
      case 'h3':
        this.selection.changeBlockType(MediumEditor.BlockModel.prototype.TYPES.HEADING3);
        break;
      case 'quote':
        this.selection.changeBlockType(MediumEditor.BlockModel.prototype.TYPES.QUOTE);
        break;
    }
  },
  _onSelectionChanged: function() {
    this._position();
  },
  _position: function() {
    if (this.selection.isRange()) {

      // Measure the highlight menu itself by creating
      // an invisible clone
      var clone = this.el.cloneNode(true);
      clone.style.visibility = 'hidden';
      this.el.parentNode.appendChild(clone);
      clone.className = 'medium-editor-highlight-menu medium-editor-highlight-menu-active';
      var highlightMenuWidth = clone.offsetWidth;
      var highlightMenuHeight = clone.offsetHeight;
      clone.parentNode.removeChild(clone);

      // Calculate x and y
      var rect = this.selection.rectangle();
      var x = (rect.right + rect.left - highlightMenuWidth) / 2.0;
      var y = rect.top - highlightMenuHeight;

      // Set position and make visible
      this.el.style.left = x + 'px';
      this.el.style.top = y + 'px';
      this.el.className = 'medium-editor-highlight-menu medium-editor-highlight-menu-active';
    } else {
      this.el.className = 'medium-editor-highlight-menu';
    }
  }
});
