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
    this.selection = attrs['selection'];

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
    this.on('changed', this.selection, this._onSelectionChanged.bind(this));
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
        this._insertImage();
        break;
      case 'video':

        break;
      case 'divider':
        this.selection.changeType(MediumEditor.BlockModel.prototype.TYPES.DIVIDER);
        break;
    }
  },
  // Insert an image, replacing the current
  // block.
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

          // Replace the current block with a figure
          // containing the image, then give it
          // focus
          this.selection.changeType(MediumEditor.BlockModel.prototype.TYPES.IMAGE, { src: e.target.result });

        }).bind(this);
        reader.readAsDataURL(fileInput.files[0]);
      }

    }).bind(this));

    // Simulate a click so the dialog opens
    var ev = document.createEvent('Events');
    ev.initEvent('click', true, false);
    fileInput.dispatchEvent(ev);
  },
  _onSelectionChanged: function() {
    this._position();
  },
  _position: function() {
    if (this.selection.type == MediumEditor.Selection.prototype.TYPES.CARET &&                  // If it's a caret selection ...
        this.selection.startModel.type == MediumEditor.BlockModel.prototype.TYPES.PARAGRAPH &&  // ... and we're on a paragraph ...
        this.selection.startModel.text == '') {                                                 // ... and it's blank ...

        // Position and show the element
        var selectionEl = this.editorView.documentView.el.childNodes[selection.startIx];
        var rect = selectionEl.getBoundingClientRect();
        var editorRect = this.editorView.el.getBoundingClientRect();      // Convert to editor space
        var top = rect.top - editorRect.top;
        this.el.style.top = top + 'px';
        this.el.style.left = '50px';

        this.el.className = [this.CLASS_NAME, this.ACTIVE_CLASS_NAME].join(' ');

    } else {

        // Otherwise hide it
        this.el.className = this.CLASS_NAME;
    }
  }
});
