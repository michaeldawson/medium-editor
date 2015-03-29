var TestPage = require('./pages/test.page.js');

describe('Caret at the start of a blank paragraph', function() {
  it('should show the inline tooltip', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.click();          // Give the doc focus

    browser.sleep(150);   // Animation fade in
    expect($('.medium-editor-inline-tooltip').isDisplayed()).toBe(true);

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(0);
    expect(selectionModel.startOffset).toEqual(0);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual(null);
    expect(selectionDOM.startOffset).toEqual(0);
  });
});

describe('Caret at the start of a paragraph with content', function() {
  it('should not show the inline tooltip', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys("Hi there");
    for(var i = 0; i < 8; i++) {
      doc.sendKeys(protractor.Key.ARROW_LEFT);
    }

    browser.sleep(150);   // Animation fade in
    expect($('.medium-editor-inline-tooltip').isDisplayed()).toBe(false);

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(0);
    expect(selectionModel.startOffset).toEqual(0);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual('Hi there');
    expect(selectionDOM.startOffset).toEqual(0);
  });
});

describe('Caret at the start of a blank quote block', function() {
  it('should not show the inline tooltip', function() {

  });
});

describe('Caret at the start of a blank header', function() {
  it('should show the inline tooltip', function() {

  });
});

describe('Range selection beginning at the start of a blank paragraph', function() {
  it('should not show the inline tooltip', function() {
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
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.NULL
    );

    browser.sleep(150);   // Animation fade in
    expect($('.medium-editor-inline-tooltip').isDisplayed()).toBe(false);

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(0);
    expect(selectionModel.startOffset).toEqual(0);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual('Medium');
    expect(selectionDOM.startOffset).toEqual(0);
  });
});
