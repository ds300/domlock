function bundle(inFile, outFile, done) {
    var browserify = require('browserify');
    var fs = require('fs');
    var b = browserify();
    b.add(inFile);
    b.bundle().pipe(fs.createWriteStream(outFile)).on('close', done);
}

module.exports = function (grunt) {
  grunt.initConfig({
    watch: {
      files: ['src/**/*.js', 'test/test.js', 'todo/todo.js', 'todo/todo.html'],
      tasks: ['test', 'todo'],
    },
  });
  grunt.registerTask('test', function () {
    bundle('./test/test.js', './test/bundle.js', this.async());
  });
  grunt.registerTask('todo', function () {
    bundle('./todo/todo.js', './todo/bundle.js', this.async());
  });
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.registerTask('default', ['test', 'todo', 'watch']);
};
