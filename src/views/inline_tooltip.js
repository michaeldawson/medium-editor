// ---------------------------------------------
//  Inline Tooltip
// ---------------------------------------------

MediumEditor.InlineTooltipView = MediumEditor.View.extend({

  BUTTONS: {
    'image':          '<i class="glyphicon glyphicon-picture"></i>',
    'video':          '<i class="glyphicon glyphicon-facetime-video"></i>',
    'divider':        '<span>- -</span>'
  },

  CLASS_NAME:         'medium-editor-inline-tooltip',

  ACTIVE_CLASS_NAME:  'medium-editor-inline-tooltip-active',

  OPEN_CLASS_NAME:    'medium-editor-inline-tooltip-open',

  TOGGLE_CLASS_NAME:  'medium-editor-inline-tooltip-toggle',

  BUTTON_CLASS_NAME:  'medium-editor-inline-tooltip-button',

  init: function(attrs) {
    this._super(attrs);
    this.editorView = attrs['editorView'];

    // Create the element
    this.el = document.createElement('div');
    this.el.className = this.CLASS_NAME;

    // Create the toggle button
    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = this.TOGGLE_CLASS_NAME;
    this.on('mousedown touchstart', toggle, this._onToggle.bind(this));
    toggle.appendChild(document.createElement('span'));
    this.el.appendChild(toggle);

    // Create buttons
    for (var action in this.BUTTONS) {
      if (this.BUTTONS.hasOwnProperty(action)) {
        var html = this.BUTTONS[action];
        var button = document.createElement('button');
        button.type = 'button';
        button.className = this.BUTTON_CLASS_NAME;
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
  _onToggle: function() {
    var baseClasses = [this.CLASS_NAME, this.ACTIVE_CLASS_NAME];
    if (this.el.className.indexOf(this.OPEN_CLASS_NAME) < 0) {
      baseClasses.push(this.OPEN_CLASS_NAME);
    }
    this.el.className = baseClasses.join(' ');
  },
  _onButton: function(e) {
    var action = e.currentTarget.getAttribute('data-action');
    switch(action) {
      case 'image':

        break;
      case 'video':

        break;
      case 'divider':
        this.model.changeBlockType(this.editorView.selection, 'divider');
        this.editorView._refreshSelection();
        break;
    }
  },
  _onSelectionChanged: function(selection) {
    this._position(selection);
  },
  _position: function(selection) {
    if (selection.type == 'caret' &&                                      // If it's a caret selection ...
        selection.startBlock.type == 'paragraph' &&                       // ... and we're on a paragraph ...
        selection.startBlock.text == '') {                                // ... and it's blank ...

        // Position and show the element
        var selectionEl = this.editorView.documentView.el.childNodes[selection.startIx];
        var rect = selectionEl.getBoundingClientRect();
        var editorRect = this.editorView.el.getBoundingClientRect();      // Convert to editor space
        var top = rect.top - editorRect.top;
        this.el.style.top = top + 'px';

        this.el.className = [this.CLASS_NAME, this.ACTIVE_CLASS_NAME].join(' ');

    } else {

        // Otherwise hide it
        this.el.className = this.CLASS_NAME;
    }
  }
});
