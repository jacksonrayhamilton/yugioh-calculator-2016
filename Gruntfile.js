/* eslint-env node */

export default function (grunt) {

  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.loadNpmTasks('grunt-favicons');

  grunt.initConfig({
    favicons: {
      options: {
        androidHomescreen: true,
        appleTouchBackgroundColor: '#ffffff',
        appleTouchPadding: 0,
        tileBlackWhite: false,
        tileColor: 'none',
        trueColor: true
      },
      build: {
        options: {
          html: 'public/index.html'
        },
        src: 'app/assets/web-app-icon.png',
        dest: 'public'
      }
    },
    htmlmin: {
      build: {
        options: {
          collapseBooleanAttributes: true,
          collapseWhitespace: true,
          conservativeCollapse: true,
          minifyCss: true,
          minifyJs: true,
          processConditionalComments: true,
          removeAttributeQuotes: true,
          removeComments: true,
          removeEmptyAttributes: true,
          removeOptionalTags: true,
          removeRedundantAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
          removeTagWhitespace: true,
          sortAttributes: true,
          sortClassName: true,
          useShortDoctype: true,
        },
        files: {
          'public/index.html': 'public/index.html'
        }
      }
    }
  });

  grunt.registerTask('default', ['favicons', 'htmlmin']);

};
