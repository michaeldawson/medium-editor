var TestPage = require('./pages/test.page.js');

describe('Highlighting a range within a single paragraph', function() {
  it('should show the highlight menu above', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys(
      "Medium",
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.SHIFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.NULL
    );

    browser.sleep(150);   // Animation fade in
    expect($('.medium-editor-highlight-menu').isDisplayed()).toBe(true);

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(0);
    expect(selectionModel.startOffset).toEqual(2);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual("Medium");
    expect(selectionDOM.startOffset).toEqual(2);
  });
});

describe('A caret selection', function() {
  it('should not show the highlight menu', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys(
      "Medium",
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT
    );

    browser.sleep(150);   // Animation fade in
    expect($('.medium-editor-highlight-menu').isDisplayed()).toBe(false);

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(0);
    expect(selectionModel.startOffset).toEqual(4);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual("Medium");
    expect(selectionDOM.startOffset).toEqual(4);
  });
});

describe('Changing selection while the highlight menu is open', function() {
  it('should keep it visible', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys(
      "Medium",
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.SHIFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.NULL
    );

    browser.sleep(150);   // Animation fade in
    expect($('.medium-editor-highlight-menu').isDisplayed()).toBe(true);

    doc.sendKeys(
      protractor.Key.SHIFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.NULL
    );

    expect($('.medium-editor-highlight-menu').isDisplayed()).toBe(true);  // Without the animation delay

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(0);
    expect(selectionModel.startOffset).toEqual(1);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual("Medium");
    expect(selectionDOM.startOffset).toEqual(1);
  });
});


// if i highlight a range, then click somewhere within that range, the selection model doesn't seem to update
//   hitting enter causes the line break at the last place the cursor was
//   the highlight menu stays active

// highlighting multiple blocks where one is an image or divider - which highlight menu buttons to show?
