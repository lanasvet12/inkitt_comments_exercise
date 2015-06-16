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
var nodemon = require('gulp-nodemon');
// var sourcemaps = require('gulp-sourcemaps');
var browserSync = require('browser-sync');
var reload      = browserSync.reload;


gulp.task('default', ['compile:js', 'compile:css', 'browser-sync', 'nodemon:run'], function () {
  gulp.watch(["./src/js/**/*.js"], ["compile:js"]).on('change', reload);
  gulp.watch(["./src/css/**/*.styl"], ["compile:css"]).on('change', reload);
});

gulp.task('nodemon:run', function () {
  nodemon({
    script: 'server.js'
  , ext: 'js html'
  , env: { 'NODE_ENV': 'development' }
  })
})

gulp.task('browser-sync', function() {
  browserSync({
    port: 7000,
    proxy: "http://localhost:3000",
  });
});

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
  var b = browserify();
    b.transform(reactify); // use the reactify transform
    b.add('./src/js/main.js');

  return b.bundle()
    .pipe(source("main.js"))
    .pipe(gulp.dest("./public/assets/js"));
});

gulp.task("compile:css", function () {
  gulp.src('./src/css/**/*.styl')
    .pipe(stylus({ use: [axis(), jeet(), rupture()], compress: false, 'include css': true }))
    .pipe(csslint())
    .pipe(csslint.reporter())
    .pipe(gulp.dest('./public/assets/css'));
});