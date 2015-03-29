var TestPage = require('./pages/test.page.js');

describe('Highlighting a range, then clicking within that range', function() {
  it('should change selection to a caret and close the highlight menu', function() {

    // This test exists because of a bug where
    // after clicking inside a selected range,
    // `window.getSelection()` still returned the
    // range selection. We fixed by placing the
    // call to `determineFromBrowser` in the
    // `mouseUp` event handler of editor inside a
    // short timeout.

    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys(
      "Medium",
      protractor.Key.SHIFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.NULL
    );

    browser.sleep(150);   // Animation fade in
    expect($('.medium-editor-highlight-menu').isDisplayed()).toBe(true);

    $('p').click();

    browser.sleep(150);   // Animation fade out
    expect($('.medium-editor-highlight-menu').isDisplayed()).toBe(false);

    var selectionModel = page.selectionModel();
    expect(selectionModel.isCaret).toBe(true);
    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startOffset).toEqual(selectionDOM.endOffset);
  });
});

describe('Triple-clicking a paragraph', function() {
  it('should set the selection model to the end offset of the paragraph, not offset 0 of the next', function() {

    // This test exists because by default,
    // `window.getSelection()` will report a
    // paragraph selection as starting at offset 0
    // of the paragraph and ending at offset 0 of
    // the next. That causes problems for things
    // like markups and enter/backspace.

    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys("Test paragraph");
    doc.sendKeys(protractor.Key.ENTER);
    doc.sendKeys("Another test paragraph");
    doc.sendKeys(protractor.Key.ARROW_UP);
    for(var i = 0; i < 14; i++) {
      doc.sendKeys(protractor.Key.ARROW_LEFT);
    }
    doc.sendKeys(
      protractor.Key.SHIFT,
      protractor.Key.ARROW_DOWN,
      protractor.Key.NULL
    );

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(0);
    expect(selectionModel.startOffset).toEqual(0);
    expect(selectionModel.endIx).toEqual(0);
    expect(selectionModel.endOffset).toEqual(14);

  });
});
