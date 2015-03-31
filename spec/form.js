var TestPage = require('./pages/test.page.js');

describe('Being attached to a form textarea', function() {
  it('should output HTML to the hidden textarea on every change', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys("This is a test paragraph");

    var textarea = $('textarea');
    expect(textarea.getAttribute('value')).toEqual("<div class='layout-single-column'><p>This is a test paragraph</p></div>");
  });
  it('should not output editor attributes like "contenteditable"', function() {
    // TODO
  });
});
