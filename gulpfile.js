// Inspiration from:
// https://gist.github.com/Fishrock123/8ea81dad3197c2f84366

var gulp = require('gulp')

var gutil = require('gulp-util');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var rename = require('gulp-rename');

var browserify = require('browserify');
var watch = require('gulp-watch');
var sourcemaps  = require('gulp-sourcemaps');

gulp.task('scripts', function() {
    return browserify({
        entries: './app/src/bundle.js',
        debug: true
     })
    .bundle()
    .on('error', function(err) {
        gutil.log("Browserify Error", gutil.colors.red(err.message));
        // emit end to not break on error.
        this.emit('end');
    })
    .pipe(source('bundle.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(uglify())
    .pipe(sourcemaps.write('./maps'))
    .pipe(gulp.dest('./app/dist'));
 
});

gulp.task('watch', ['default'], function() {
    gulp.watch('app/src/**/*.js', ['lint', 'scripts']);

});

gulp.task('lint', function() {
    return gulp.src('app/src/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('default', ['lint', 'scripts']);