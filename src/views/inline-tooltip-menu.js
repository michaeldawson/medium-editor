// ------------------------------------------------
//  Inline Tooltip Menu
// ------------------------------------------------
//  Appears next to a blank paragraph. Allows it
//  to be converted to an image, a video or a
//  divider.
// ------------------------------------------------

MediumEditor.InlineTooltipMenuView = MediumEditor.View.extend({

  BUTTONS: {
    'toggle':   '<i class="ion-ios-plus-empty"></i>',
    'image':    '<i class="ion-ios-camera-outline"></i>',
    'video':    '<i class="ion-ios-videocam-outline"></i>',
    'divider':  '<i class="ion-ios-minus-empty"></i>'
  },

  CLASS_NAME:             'medium-editor-inline-tooltip',

  ACTIVE_CLASS_NAME:      'medium-editor-inline-tooltip-active',

  OPEN_CLASS_NAME:        'medium-editor-inline-tooltip-open',

  TOGGLE_CLASS_NAME:      'medium-editor-inline-tooltip-toggle',

  BUTTON_SET_CLASS_NAME:  'medium-editor-inline-tooltip-button-set',

  // ----------------------------------------------
  //  Constructor
  // ----------------------------------------------

  init: function(attrs) {
    this._super(attrs);
    this._editor = attrs['editor'];

    // Listen for changes to the selection - if it
    // changes to a caret on an empty paragraph,
    // show and position, otherwise hide.
    this.on('changed', this._selection().model(), this._onSelectionChanged.bind(this));

    // Perform an initial render
    this._render();
  },

  // ----------------------------------------------
  //  Event Handlers
  // ----------------------------------------------

  _onSelectionChanged: function() {
    var selectionModel = this._selection().model();
    var selectedBlock = selectionModel.startBlock();
    if (selectionModel.isCaret() &&
        selectedBlock.isParagraph() &&
        selectedBlock.isEmpty()) {
        this._showAndPosition();
    } else {
      this._hide();
    }
  },

  // ----------------------------------------------
  //  Utility Methods
  // ----------------------------------------------

  _render: function() {

    // Create the element
    this._el = document.createElement('div');
    this._el.className = this.CLASS_NAME;

    // Create the toggle button
    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = this.TOGGLE_CLASS_NAME;
    toggle.innerHTML = this.BUTTONS.toggle;
    this.on('click', toggle, this._toggle.bind(this));
    this._el.appendChild(toggle);

    // Create the button set
    var buttonSet = document.createElement('div');
    buttonSet.className = this.BUTTON_SET_CLASS_NAME;
    this._el.appendChild(buttonSet);

    // Create buttons
    for (var action in this.BUTTONS) {
      if (this.BUTTONS.hasOwnProperty(action) && action != 'toggle') {
        var button = document.createElement('button');
        button.type = 'button';
        button.innerHTML = this.BUTTONS[action];
        button.setAttribute('data-action', action);
        this.on('click', button, this._onButton.bind(this));
        buttonSet.appendChild(button);
      }
    }
  },

  _showAndPosition: function() {
    var rectangle = this._selection().rectangle();
    this._el.style.top = rectangle.top + 'px';
    this._el.style.left = rectangle.left + 'px';
    this._el.className = [this.CLASS_NAME, this.ACTIVE_CLASS_NAME].join(' ');
  },

  _toggle: function() {
    var baseClasses = [this.CLASS_NAME, this.ACTIVE_CLASS_NAME];
    if (this._el.className.indexOf(this.OPEN_CLASS_NAME) < 0) {
      baseClasses.push(this.OPEN_CLASS_NAME);
    }
    this._el.className = baseClasses.join(' ');
  },

  _onButton: function(e) {
    var action = e.currentTarget.getAttribute('data-action');
    var selectionModel = this._selection().model();
    switch(action) {
      case 'image':
        this._insertImage();
        break;
      case 'video':

        break;
      case 'divider':
        this._model.changeBlockType('DIVIDER', selectionModel);
        break;
    }
  },

  // Insert an image, replacing the current block
  _insertImage: function() {

    // Create a hidden file input
    var fileInput = document.createElement('input');
    fileInput.type = 'file';

    // When the value changes (the user selects a
    // file or cancels the dialog)
    this.on('change', fileInput, (function(e) {

      // If they selected a file ...
      if (fileInput.files && fileInput.files[0]) {

        // Read the file
        var reader = new FileReader();
        reader.onload = (function(e) {

          // Replace the current block with a
          // figure containing the image
          this._model.changeBlockType('IMAGE', { metadata: { src: e.target.result } }, this._selection().model());

        }).bind(this);
        reader.readAsDataURL(fileInput.files[0]);
      }

    }).bind(this));

    // Simulate a click so the dialog opens
    var ev = document.createEvent('Events');
    ev.initEvent('click', true, false);
    fileInput.dispatchEvent(ev);
  },

  _hide: function() {
    this._el.className = this.CLASS_NAME;
  },

  // Shorthand
  _selection: function() {
    return this._editor.selection();
  },

});
