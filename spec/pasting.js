var TestPage = require('./pages/test.page.js');

describe('Pasting some HTML content into the editor', function() {
  it('should clean it up and insert it', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys("This is a test paragraph");
    for(var i = 0; i < 5; i++) {
      doc.sendKeys(protractor.Key.ARROW_LEFT);
    }
    doc.sendKeys(protractor.Key.ENTER);
    var paragraphs = doc.all(by.css('p'));
    expect(paragraphs.count()).toEqual(2);
    expect(paragraphs.get(0).getText()).toEqual('This is a test para');
    expect(paragraphs.get(1).getText()).toEqual('graph');

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(1);
    expect(selectionModel.startOffset).toEqual(0);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual('graph');
    expect(selectionDOM.startOffset).toEqual(0);
  });
});
