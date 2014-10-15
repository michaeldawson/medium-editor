// ---------------------------------------------
//  Highlight Menu
// ---------------------------------------------

MediumEditor.HighlightMenuView = MediumEditor.View.extend({

  BUTTONS: {
    'strong':         '<i class="glyphicon glyphicon-bold"></i>',
    'emphasis':       '<i class="glyphicon glyphicon-italic"></i>',
    'h1':             'H1',
    'h2':             'H2',
    'h3':             'H3',
    'quote':          '<i class="glyphicon fa fa-quote-right"></i>',
    'anchor':         '<i class="glyphicon glyphicon-link"></i>'
  },

  init: function(attrs) {
    this._super(attrs);
    this.editorView = attrs['editorView'];

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
    this.on('changed', this.editorView.selection, this._onSelectionChanged.bind(this));
  },
  _onButton: function(e) {
    var action = e.currentTarget.getAttribute('data-action');
    switch(action) {
      case 'strong':
        this.model.markup(this.editorView.selection, MediumEditor.StrongModel);
        break;
      case 'emphasis':
        this.model.markup(this.editorView.selection, MediumEditor.EmphasisModel);
        break;
      case 'h1':
      case 'h2':
      case 'h3':
      case 'quote':
        this.model.changeBlockType(this.editorView.selection, action);
        break;
    }
  },
  _onSelectionChanged: function(selection) {
    this._position(selection);
  },
  _position: function(selection) {
    if (selection.type == 'range') {
      var rect = selection.rectangle;

      // Convert to editor space
      var editorRect = this.editorView.el.getBoundingClientRect();
      var top = rect.top - editorRect.top; var bottom = rect.bottom - editorRect.top;
      var left = rect.left - editorRect.left; var right = rect.right - editorRect.left;

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
      var x = (right + left - highlightMenuWidth) / 2.0;
      var y = top - highlightMenuHeight;

      // Clamp to the editor
      x = Math.min(Math.max(x, 0), editorRect.width - highlightMenuWidth);
      y = Math.min(y, editorRect.height - highlightMenuHeight);

      // Set position and make visible
      this.el.style.left = x + 'px';
      this.el.style.top = y + 'px';
      this.el.className = 'medium-editor-highlight-menu medium-editor-highlight-menu-active';
    } else {
      this.el.className = 'medium-editor-highlight-menu';
    }
  }
});
