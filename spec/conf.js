exports.config = {
  seleniumAddress: 'http://localhost:4444/wd/hub',
  baseUrl: 'http://localhost:9876',
  specs: ['simple-editing.js','lists.js']
};
