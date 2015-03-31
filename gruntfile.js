module.exports = function (grunt) {

  grunt.initConfig({

    concat: {
      options: {
        stripBanners: true
      },
      dist: {
        src:      [
                    'src/utils/polyfills.js',
                    'src/utils/inheritance.js',
                    'src/utils/namespace.js',
                    'src/utils/mvc.js',
                    'src/utils/model-dom-mapper.js',
                    'src/models/document.js',
                    'src/models/block.js',
                    'src/models/markup.js',
                    'src/models/selection.js',
                    'src/collections/block.js',
                    'src/collections/markup.js',
                    'src/views/inline-tooltip-menu.js',
                    'src/views/highlight-menu.js',
                    'src/views/selection.js',
                    'src/views/editor.js',
                    'src/views/document.js',
                    'src/medium-editor.js'
                  ],
        dest:     'dist/js/medium-editor.js',
        nonull:   true
      }
    },

    uglify: {
      options: {
        report: 'gzip'
      },
      build: {
        src: 'dist/js/medium-editor.js',
        dest: 'dist/js/medium-editor.min.js'
      }
    },

    cssmin: {
      main: {
        expand: true,
        src: ['medium-editor.css'],
        dest: 'dist/css/',
        ext: '.min.css'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  grunt.registerTask('build', [ 'concat', 'uglify', 'cssmin' ]);

};
