// ---------------------------------------------
//  Inline Tooltip
// ---------------------------------------------

MediumEditor.InlineTooltipView = MediumEditor.View.extend({

  init: function(attrs) {
    this._super(attrs);
    this.editorView = attrs['editorView'];

    // Create the element
    this.el = document.createElement('div');
    this.el.className = 'medium-editor-inline-tooltip';

    // Create the toggle button
    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'medium-editor-inline-tooltip-toggle';
    this.on('mousedown touchstart', toggle, this._onToggle.bind(this));
    toggle.appendChild(document.createElement('span'));
    this.el.appendChild(toggle);

    // Create buttons
    var buttons = {
      'image':        '<i class="glyphicon glyphicon-picture"></i>',
      'video':        '<i class="glyphicon glyphicon-facetime-video"></i>',
      'hr':           '<span>- -</span>'
    };
    for (var action in buttons) {
      if (buttons.hasOwnProperty(action)) {
        var html = buttons[action];
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'medium-editor-inline-tooltip-button';
        button.innerHTML = html;
        button.setAttribute('data', "action: '" + action + "'");
        this.on('mousedown touchstart', button, this._onButton.bind(this));
        this.el.appendChild(button);
      }
    }

    // Listen to selection changes and show/hide/
    // position accordingly
    this.on('changed', attrs['selection'], this._onSelectionChanged.bind(this));
  },
  _onToggle: function() {
    if (this.el.className.indexOf('medium-editor-inline-tooltip-open') < 0) {
      this.el.className = 'medium-editor-inline-tooltip medium-editor-inline-tooltip-active medium-editor-inline-tooltip-open';
    } else {
      this.el.className = 'medium-editor-inline-tooltip medium-editor-inline-tooltip-active';
    }
  },
  _onButton: function() {
    // TODO
  },
  _onSelectionChanged: function(selection) {
    this._position(selection);
  },
  _position: function(selection) {
    if (selection.type == 'caret' &&                                      // If it's a caret selection ...
        selection.startBlock instanceof MediumEditor.ParagraphModel &&    // ... and we're on a paragraph ...
        selection.startBlock.text == '') {                                // ... and it's blank ...

        // Position and show the element
        var selectionEl = this.editorView.documentView.el.childNodes[selection.startIx];
        var rect = selectionEl.getBoundingClientRect();
        var editorRect = this.editorView.el.getBoundingClientRect();      // Convert to editor space
        var top = rect.top - editorRect.top;
        this.el.style.top = top + 'px';

        this.el.className = 'medium-editor-inline-tooltip medium-editor-inline-tooltip-active';

    } else {

        // Otherwise hide it
        this.el.className = 'medium-editor-inline-tooltip';
    }
  }
});
