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
    this._selection = attrs['selection'];

    // Create the element
    this._el = document.createElement('div');
    this._el.className = 'medium-editor-highlight-menu';
    var arrow = document.createElement('div');
    arrow.className = 'medium-editor-highlight-menu-arrow';
    this._el.appendChild(arrow);

    // Create buttons
    for (var action in this.BUTTONS) {
      if (this.BUTTONS.hasOwnProperty(action)) {
        var html = this.BUTTONS[action];
        var button = document.createElement('button');
        button.type = 'button';
        button.innerHTML = html;
        button.setAttribute('data-action', action);
        this.on('mousedown touchstart', button, this._onButton.bind(this));
        this._el.appendChild(button);
      }
    }

    // Listen to selection changes and show/hide/
    // position accordingly
    this.on('changed', this._selection.model(), this._onSelectionChanged.bind(this));
  },
  _onButton: function(e) {
    var action = e.currentTarget.getAttribute('data-action');
    switch(action) {
      case 'strong':
        this._model.markup('STRONG', this._selection.model());
        break;
      case 'emphasis':
        this._model.markup('EMPHASIS', this._selection.model());
        break;
      case 'h1':
        this._model.changeBlockType('HEADING1', this._selection.model());
        break;
      case 'h2':
        this._model.changeBlockType('HEADING2', this._selection.model());
        break;
      case 'h3':
        this._model.changeBlockType('HEADING3', this._selection.model());
        break;
      case 'quote':
        this._model.changeBlockType('QUOTE', this._selection.model());
        break;
    }
  },
  _onSelectionChanged: function() {
    this._position();
  },
  _position: function() {
    if (this._selection.model().isRange()) {

      // Measure the highlight menu itself by creating
      // an invisible clone
      var clone = this._el.cloneNode(true);
      clone.style.visibility = 'hidden';
      this._el.parentNode.appendChild(clone);
      clone.className = 'medium-editor-highlight-menu medium-editor-highlight-menu-active';
      var highlightMenuWidth = clone.offsetWidth;
      var highlightMenuHeight = clone.offsetHeight;
      clone.parentNode.removeChild(clone);

      // Calculate x and y
      var rect = this._selection.rectangle();
      var x = (rect.right + rect.left - highlightMenuWidth) / 2.0;
      var y = rect.top - highlightMenuHeight;

      // Set position and make visible
      this._el.style.left = x + 'px';
      this._el.style.top = y + 'px';
      this._el.className = 'medium-editor-highlight-menu medium-editor-highlight-menu-active';
    } else {
      this._el.className = 'medium-editor-highlight-menu';
    }
  }
});
