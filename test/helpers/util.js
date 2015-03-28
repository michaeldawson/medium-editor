function setupEditor(initialHTML) {
  var fixture = document.getElementById("qunit-fixture");
  var editor = document.createElement('div');
  fixture.appendChild(editor);
  editor.innerHTML = "<p>This is a single paragraph</p>";
  return new MediumEditor(editor);
}

function documentEl(editor) {
  return editor._editorView._document._el
}

function documentHTML(editor) {
  return documentEl(editor).innerHTML;
}

function selectionModel(editor) {
  return editor._editorView._selection._model;
}

function setSelection(editor, ix, offset) {
  var selectionModel = editor._editorView._selection._model;
  selectionModel.set({
    ix:      ix,
    offset:  offset
  });
}

function simulateKeydown(code, target) {
  target = typeof target === 'undefined' ? document : target;
  var evt = document.createEvent("HTMLEvents");
  evt.initEvent('keydown', true, true);
  evt.keyCode = code;
  evt.which = code;
  target.dispatchEvent(evt);
}

function selectionOnBrowser() {

  var startNode, startOffset, endNode, endOffset, range;
  if (window.getSelection) {

    // Normal browsers
    var sel = window.getSelection();
    if (sel.type.toLowerCase() != 'none') {
      range = sel.getRangeAt(0);
      startNode = range.startContainer;
      startOffset = range.startOffset;
      endNode = range.endContainer;
      endOffset = range.endOffset;
    }

  } else if (document.selection) {

    // IE8
    var sel = document.selection;
    range = sel.createRange();
    var startInfo = this._ieSelectionInfo(range, 'start');
    var endInfo = this._ieSelectionInfo(range, 'end');

    startNode = startInfo.node;
    startOffset = startInfo.offset;
    endNode = endInfo.node;
    endOffset = endInfo.offset;
  }

  return {
    type:         !startNode ? 'none' : (startNode == endNode && startOffset == endOffset ? 'caret' : 'range'),
    startNode:    startNode,
    startOffset:  startOffset,
    endNode:      endNode,
    endOffset:    endOffset
  }
}
