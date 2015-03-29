// ------------------------------------------------
//  Highlight Menu
// ------------------------------------------------
//  Appears over the top of highlighted text and
//  media objects. Allows markups and formatting
//  changes.
// ------------------------------------------------

MediumEditor.HighlightMenuView = MediumEditor.View.extend({

  BUTTONS: {
    'strong':     'B',
    'emphasis':   'i',
    'heading1':   'H1',
    'heading2':   'H2',
    'heading3':   'H3',
    'quote':      '“'
    // 'anchor':     '<i class="ion-link"></i>'
  },

  CLASS_NAME:                 'medium-editor-highlight-menu',

  ACTIVE_CLASS_NAME:          'medium-editor-highlight-menu-active',

  POSITION_UNDER_CLASS_NAME:  'medium-editor-highlight-menu-under',

  BUTTON_ACTIVE_CLASS_NAME:   'medium-editor-highlight-menu-button-active',

  // ----------------------------------------------
  //  Constructor
  // ----------------------------------------------

  init: function(attrs) {
    this._super(attrs);
    this._editor = attrs['editor'];

    // Listen for changes to the selection - if it
    // changes to a range, show and position,
    // otherwise hide.
    this.on('changed', this._selection().model(), this._onSelectionChanged.bind(this));

    // Perform an initial render
    this._render();
  },

  // ----------------------------------------------
  //  Event Handlers
  // ----------------------------------------------

  _onSelectionChanged: function() {
    var selectionModel = this._selection().model();
    if (selectionModel.isRange() || selectionModel.isMedia()) {
      this._showAndPosition();
      this._updateButtonStates();
    } else {
      this._hide();
    }
  },

  _onButton: function(e) {
    var action = e.currentTarget.getAttribute('data-action').toUpperCase();
    var selectionModel = this._selection().model();
    switch(action) {
      case 'STRONG':
      case 'EMPHASIS':
        this._model.addMarkup(action, selectionModel);
        break;
      case 'HEADING1':
      case 'HEADING2':
      case 'HEADING3':
      case 'QUOTE':
        var enabled = this._model.isSelectionWithinBlockType(action, selectionModel);
        this._model.changeBlockType(enabled ? 'PARAGRAPH' : action, selectionModel);
        break;
    }
  },

  // ----------------------------------------------
  //  Utility Methods
  // ----------------------------------------------

  _render: function() {

    // Create the element
    this._el = document.createElement('div');
    this._el.className = this.CLASS_NAME;

    // Create buttons
    for (var action in this.BUTTONS) {
      if (this.BUTTONS.hasOwnProperty(action)) {
        var button = document.createElement('button');
        button.type = 'button';
        button.innerHTML = this.BUTTONS[action];
        button.setAttribute('data-action', action);
        this.on('click', button, this._onButton.bind(this));
        this._el.appendChild(button);
      }
    }
  },

  _showAndPosition: function() {
    var rectangle = this._selection().rectangle();

    // Measure the highlight menu itself by creating
    // an invisible clone
    var clone = this._el.cloneNode(true);
    clone.style.visibility = 'hidden';
    this._el.parentNode.appendChild(clone);
    clone.className = [this.CLASS_NAME, this.ACTIVE_CLASS_NAME].join(' ');
    var highlightMenuWidth = clone.offsetWidth;
    var highlightMenuHeight = clone.offsetHeight;
    clone.parentNode.removeChild(clone);

    // Calculate x and y
    var x = (rectangle.right + rectangle.left - highlightMenuWidth) / 2.0;
    var y = rectangle.top - highlightMenuHeight;

    // Show underneath if there's not enough room
    // at the top
    classNames = [this.CLASS_NAME, this.ACTIVE_CLASS_NAME];
    if (rectangle.clientTop < highlightMenuHeight) {
      y = rectangle.bottom;
      classNames.push(this.POSITION_UNDER_CLASS_NAME);
    }

    this._el.style.top = y + 'px';
    this._el.style.left = x + 'px';
    this._el.className = classNames.join(' ');
  },

  _updateButtonStates: function() {
    var selectionModel = this._selection().model();
    for(var i = 0; i < this._el.childNodes.length; i++) {
      var button = this._el.childNodes[i];
      var action = button.dataset.action.toUpperCase();
      switch(action) {
        case 'STRONG':
        case 'EMPHASIS':
          var enabled = this._model.isSelectionWithinMarkupType(action, selectionModel);
          button.className = enabled ? this.BUTTON_ACTIVE_CLASS_NAME : '';
          break;
        case 'HEADING1':
        case 'HEADING2':
        case 'HEADING3':
        case 'QUOTE':
          var enabled = this._model.isSelectionWithinBlockType(action, selectionModel);
          button.className = enabled ? this.BUTTON_ACTIVE_CLASS_NAME : '';
          break;
      }
    }
  },

  _hide: function() {
    this._el.className = this.CLASS_NAME;
  },

  // Shorthand
  _selection: function() {
    return this._editor.selection();
  },

});
