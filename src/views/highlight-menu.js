// ------------------------------------------------
//  Highlight Menu
// ------------------------------------------------
//  Appears over the top of highlighted text and
//  media objects. Allows markups and formatting
//  changes.
// ------------------------------------------------

MediumEditor.HighlightMenuView = MediumEditor.View.extend({

  CLASS_NAME:                 'medium-editor-highlight-menu',

  ACTIVE_CLASS_NAME:          'medium-editor-highlight-menu-active',

  POSITION_UNDER_CLASS_NAME:  'medium-editor-highlight-menu-under',

  BUTTON_ACTIVE_CLASS_NAME:   'medium-editor-highlight-menu-button-active',

  BUTTONS: {

    // --------------------------------------------
    //  Strong (bold) button
    // --------------------------------------------

    'STRONG': {
      buttonHTML: function() {
        return 'B';
      },
      isVisible: function() {
        return this._allBlocksSupportMarkup('STRONG');
      },
      buttonClass: function() {
        if (this._markedUpAs('STRONG')) {
          return this.BUTTON_ACTIVE_CLASS_NAME;
        } else {
          return null;
        }
      },
      onClick: function() {
        this._model.toggleMarkup('STRONG', this._selectionModel());
      }
    },

    // --------------------------------------------
    //  Emphasis (italic) button
    // --------------------------------------------

    'EMPHASIS': {
      buttonHTML: function() {
        return 'i';
      },
      isVisible: function() {
        return this._allBlocksSupportMarkup('EMPHASIS');
      },
      buttonClass: function() {
        if (this._markedUpAs('EMPHASIS')) {
          return this.BUTTON_ACTIVE_CLASS_NAME;
        } else {
          return null;
        }
      },
      onClick: function() {
        this._model.toggleMarkup('EMPHASIS', this._selectionModel());
      }
    },

    // --------------------------------------------
    //  Heading 1 button
    // --------------------------------------------

    'HEADING1': {
      buttonHTML: function() {
        return 'H1';
      },
      isVisible: function() {
        return this._noMediaBlocks();
      },
      buttonClass: function() {
        if (this._allBlocksAre('HEADING1')) {
          return this.BUTTON_ACTIVE_CLASS_NAME;
        } else {
          return null;
        }
      },
      onClick: function() {
        if (this._allBlocksAre('HEADING1')) {
          this._model.setType('PARAGRAPH', this._selectionModel());
        } else {
          this._model.setType('HEADING1', this._selectionModel());
        }
      }
    },

    // --------------------------------------------
    //  Heading 2 button
    // --------------------------------------------

    'HEADING2': {
      buttonHTML: function() {
        return 'H2';
      },
      isVisible: function() {
        return this._noMediaBlocks();
      },
      buttonClass: function() {
        if (this._allBlocksAre('HEADING2')) {
          return this.BUTTON_ACTIVE_CLASS_NAME;
        } else {
          return null;
        }
      },
      onClick: function() {
        if (this._allBlocksAre('HEADING2')) {
          this._model.setType('PARAGRAPH', this._selectionModel());
        } else {
          this._model.setType('HEADING2', this._selectionModel());
        }
      }
    },

    // --------------------------------------------
    //  Heading 3 button
    // --------------------------------------------

    'HEADING3': {
      buttonHTML: function() {
        return 'H3';
      },
      isVisible: function() {
        return this._noMediaBlocks();
      },
      buttonClass: function() {
        if (this._allBlocksAre('HEADING3')) {
          return this.BUTTON_ACTIVE_CLASS_NAME;
        } else {
          return null;
        }
      },
      onClick: function() {
        if (this._allBlocksAre('HEADING3')) {
          this._model.setType('PARAGRAPH', this._selectionModel());
        } else {
          this._model.setType('HEADING3', this._selectionModel());
        }
      }
    },

    // --------------------------------------------
    //  Quote button
    // --------------------------------------------

    'QUOTE': {
      buttonHTML: function() {
        return '“';
      },
      isVisible: function() {
        return this._noMediaBlocks();
      },
      buttonClass: function() {
        if (this._allBlockQuotes()) {
          return this.BUTTON_ACTIVE_CLASS_NAME;
        } else if (this._allPullQuotes()) {
          return this.BUTTON_ACTIVE_CLASS_NAME + ' medium-editor-highlight-menu-button-pull-quote';
        } else {
          return null;
        }
      },
      onClick: function() {
        if (this._allBlockQuotes()) {
          this._model.setLayout('PULL-QUOTE', this._selectionModel());
        } else if (this._allPullQuotes()) {
          this._model.setType('PARAGRAPH', this._selectionModel());
        } else {
          this._model.setType('QUOTE', this._selectionModel());
        }
      }
    },

    // --------------------------------------------
    //  Left-align media
    // --------------------------------------------

    'LEFT-ALIGN': {
      buttonHTML: function() {
        return 'L';
      },
      isVisible: function() {
        return this._allMediaBlocks();
      },
      buttonClass: function() {
        if (this._allLayoutsAre('LEFT-ALIGN')) {
          return this.BUTTON_ACTIVE_CLASS_NAME;
        } else {
          return null;
        }
      },
      onClick: function() {
        this._model.setLayout('LEFT-ALIGN', this._selectionModel());
      }
    },

    // --------------------------------------------
    //  Left-outset media
    // --------------------------------------------

    'LEFT-OUTSET': {
      buttonHTML: function() {
        return 'LO';
      },
      isVisible: function() {
        return this._allMediaBlocks();
      },
      buttonClass: function() {
        if (this._allLayoutsAre('LEFT-OUTSET')) {
          return this.BUTTON_ACTIVE_CLASS_NAME;
        } else {
          return null;
        }
      },
      onClick: function() {
        this._model.setLayout('LEFT-OUTSET', this._selectionModel());
      }
    },

    // --------------------------------------------
    //  Single-column media
    // --------------------------------------------

    'SINGLE-COLUMN': {
      buttonHTML: function() {
        return 'S';
      },
      isVisible: function() {
        return this._allMediaBlocks();
      },
      buttonClass: function() {
        if (this._allLayoutsAre('SINGLE-COLUMN')) {
          return this.BUTTON_ACTIVE_CLASS_NAME;
        } else {
          return null;
        }
      },
      onClick: function() {
        this._model.setLayout('SINGLE-COLUMN', this._selectionModel());
      }
    },

    // --------------------------------------------
    //  Full-width media
    // --------------------------------------------

    'FULL-WIDTH': {
      buttonHTML: function() {
        return 'F';
      },
      isVisible: function() {
        return this._allMediaBlocks();
      },
      buttonClass: function() {
        if (this._allLayoutsAre('FULL-WIDTH')) {
          return this.BUTTON_ACTIVE_CLASS_NAME;
        } else {
          return null;
        }
      },
      onClick: function() {
        this._model.setLayout('FULL-WIDTH', this._selectionModel());
      }
    }
  },

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
    this.on('changed', this._model, this._onDocumentChanged.bind(this));

    // Perform an initial render
    this._render();
  },

  // ----------------------------------------------
  //  Event Handlers
  // ----------------------------------------------

  _onSelectionChanged: function() {
    if (this._selectionModel().isRange() || this._selectionModel().isMedia()) {
      this._showAndPosition();
      this._updateButtonStates();
    } else {
      this._hide();
    }
  },

  _onDocumentChanged: function() {
    if (this._selectionModel().isRange() || this._selectionModel().isMedia()) {
      this._updateButtonStates();
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
        button.innerHTML = this.BUTTONS[action].buttonHTML();
        button.setAttribute('data-action', action);
        this.on('click', button, this.BUTTONS[action].onClick.bind(this));
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
    for(var i = 0; i < this._el.childNodes.length; i++) {
      var button = this._el.childNodes[i];
      var action = button.dataset.action;
      button.style.display = this.BUTTONS[action].isVisible.bind(this)() ? 'inline-block' : 'none';
      button.className = this.BUTTONS[action].buttonClass.bind(this)();
    }
  },

  _hide: function() {
    this._el.className = this.CLASS_NAME;
  },

  _selection: function() {
    return this._editor.selection();
  },

  _selectionModel: function() {
    return this._selection().model();
  },

  // Do all the selected blocks support the given
  // markup type?
  _allBlocksSupportMarkup: function(type) {
    return this._allBlocks(function(block) {
      return block.supportsMarkupType(type);
    });
  },

  _markedUpAs: function(type) {
    var selModel = this._selectionModel();
    return this._allBlocks(function(block,ix) {

      // Determine the start and end offsets of the
      // selection in this block
      var startOffset = ix == selModel.startIx() ? selModel.startOffset() : 0;
      var endOffset = ix == selModel.endIx() ? selModel.endOffset() : block.text().length;

      // Is the range marked up as the given type?
      return block.isRangeMarkedUpAs(type, startOffset, endOffset);
    });
  },

  _noMediaBlocks: function() {
    return this._allBlocks(function(block) {
      return !block.isMedia();
    });
  },

  _allMediaBlocks: function() {
    return this._allBlocks(function(block) {
      return block.isMedia();
    });
  },

  _allBlockQuotes: function() {
    return this._allBlocks(function(block) {
      return block.isQuote() && block.layout() == 'SINGLE-COLUMN';
    });
  },

  _allPullQuotes: function() {
    return this._allBlocks(function(block) {
      return block.isQuote() && block.layout() == 'PULL-QUOTE';
    });
  },

  _allBlocksAre: function(type) {
    return this._allBlocks(function(block) {
      return block.type() == type;
    });
  },

  _allLayoutsAre: function(type) {
    return this._allBlocks(function(block) {
      return block.layout() == type;
    });
  },

  // Helper method to iterate all selected blocks
  // and test them against a given function.
  _allBlocks: function(func) {
    for(var i = this._selectionModel().startIx(); i <= this._selectionModel().endIx(); i++) {
      if (!func.bind(this)(this._model.blocks().at(i), i)) return false;
    }
    return true;
  }

});
