var TestPage = require('./pages/test.page.js');

describe('Choosing "divider" from the inline tooltip', function() {
  it('should convert the current block to a divider, close the inline tooltip and give focus to the next paragraph', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.click();          // Give the doc focus

    browser.sleep(150);   // Animation fade in
    expect($('.medium-editor-inline-tooltip').isDisplayed()).toBe(true);

    element.all(by.css('.medium-editor-inline-tooltip-button-set button')).get(1).click();   // Insert divider

    expect(doc.all(by.css('p')).count()).toEqual(0);
    expect(doc.all(by.css('hr')).count()).toEqual(1);

    

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(0);
    expect(selectionModel.startOffset).toEqual(0);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual(null);
    expect(selectionDOM.startOffset).toEqual(0);
  });
});

// TODO - dividers - backspacing into a divider kills the divider
// TODO - dividers - shouldn't be able to give one focus
// TODO - dividers - should never be the last block in a document, or the first
