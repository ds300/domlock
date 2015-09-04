module.exports = function (grunt) {
  grunt.initConfig({
    watch: {
      files: ['src/**/*.js', 'test/test.js'],
      tasks: ['test'],
    },
  });
  grunt.registerTask('test', function () {
    var done = this.async();
    var browserify = require('browserify');
    var fs = require('fs');
    var b = browserify();
    b.add('./test/test.js');
    b.bundle().pipe(fs.createWriteStream('./test/bundle.js')).on('close', done);
  });
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.registerTask('default', ['test', 'watch']);
};
