var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
// var sass = require('gulp-ruby-sass');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var csslint = require('gulp-csslint');
var stylus = require('gulp-stylus');
var nib = require('nib');
var axis = require('axis');
var jeet = require ('jeet');
var rupture = require ('rupture');
var React = require('react');
var reactify = require('reactify');
var gulpreact = require('gulp-react');
var cache = require('gulp-cached');
// var sourcemaps = require('gulp-sourcemaps');
var browserSync = require('browser-sync');
var reload      = browserSync.reload;

gulp.task('default', ['compile:js', 'compile:css', 'browser-sync'], function () {
  gulp.watch(["./src/js/**/*.js"], ["compile:js"]).on('change', reload);
  gulp.watch(["./src/css/**/*.styl"], ["compile:css"]).on('change', reload);
});

gulp.task('browser-sync', function() {
  browserSync({
    server: "./public"
  });
});

// gulp.task("jshint", function () {
//   gulp.src(["./src/js/**/*.js"])
//     .pipe(jshint())
//     .pipe(jshint.reporter("jshint-stylish"));
// });

gulp.task('jshint', function() {
  var stream = gulp.src(["./src/js/**/*.js"])
    .pipe(cache('jshint'))
    .pipe(gulpreact())
    .on('error', function(err) {
      console.error('JSX ERROR in ' + err.fileName);
      console.error(err.message);
      this.end();
    })
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
 
  if (process.env.CI) {
    stream = stream.pipe(jshint.reporter('fail'));
  }
 
  return stream;
});

gulp.task("compile:js", ["jshint"], function () {
  // var bundle = browserify("./src/js/main.js").bundle();

  var b = browserify();
    b.transform(reactify); // use the reactify transform
    b.add('./src/js/main.js');

  return b.bundle()
    .pipe(source("main.js"))
    .pipe(gulp.dest("./public/assets/js"));
});



gulp.task("compile:css", function () {

  gulp.src('./src/css/**/*.styl')
    // .pipe(stylus())
    .pipe(stylus({ use: [axis(), jeet(), rupture()], compress: false, 'include css': true }))
    .pipe(csslint())
    .pipe(csslint.reporter())
    .pipe(gulp.dest('./public/assets/css'));

  // return sass('./src/scss/') 
  //   .on('error', function (err) {
  //     console.error('Error!', err.message);
  //  })
  //   .pipe(csslint())
  //   .pipe(csslint.reporter())
  //   .pipe(gulp.dest('./public/assets/css'));

});

gulp.task("watch", ["compile:css", "compile:js"], function () {
  gulp.watch(["./src/js/**/*.js"], ["compile:js"]);
  gulp.watch(["./src/css/**/*.styl"], ["compile:css"]);
});