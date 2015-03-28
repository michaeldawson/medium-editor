QUnit.test("Hitting enter halfway through a paragraph", function( assert ) {

  // Setup editor with a basic paragraph
  var editor = setupEditor("<p>This is a single paragraph</p>");
  assert.equal(documentHTML(editor), '<div class="layout-single-column"><p>This is a single paragraph</p></div>');

  // Set the caret at block 0, offset 14
  setSelection(editor, 0, 14);

  // Simulate 'enter' key down
  var mapping = MediumEditor.ModelDOMMapper.modelSpaceToDOMSpace(documentEl(editor), 0, 14);
  simulateKeydown(13, mapping.node);

  // It should have split the paragraph in two
  assert.equal(documentHTML(editor), '<div class="layout-single-column"><p>This is a sing</p><p>le paragraph</p></div>')

  // Now check both the selection model and
  // selection in the browser is set to the start
  // of the second paragraph
  var selModel = selectionModel(editor);
  assert.equal(selModel._startIx, 1);
  assert.equal(selModel._startOffset, 0);
  assert.ok(selModel.isCaret());

  var selBrowser = selectionOnBrowser();
  assert.equal(selBrowser.startNode.nodeValue, 'le paragraph');
  assert.equal(selBrowser.startOffset, 0);
  assert.equal(selBrowser.type, 'caret')

});
