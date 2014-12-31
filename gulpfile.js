"use strict";

var gulp       = require("gulp"),
    concat     = require("gulp-concat"),
    uglify     = require("gulp-uglify"),
    less       = require("gulp-less"),
    minifyCss  = require("gulp-minify-css"),
    minifyHtml = require("gulp-minify-html"),
    vinylPaths = require("vinyl-paths"),
    q          = require("q"),
    del        = require("del");

var BOWER_DIR     = "bower_components/",
    SRC_DIR       = "src/",
    TEMP_DIR      = "tmp/",
    BUILD_DIR     = "build/",
    BUILD_DEV_DIR = "build-dev/";

gulp.task("default", ["clean"], function() {
  build(BUILD_DIR);
});

gulp.task("d", ["clean"], function() {
  return build(BUILD_DEV_DIR)
    .then(function() {
      return q.fcall(del, [TEMP_DIR]);
    });
});

function build(buildDir) {
  return createTemp()
    .then(copyVendor.bind(null, buildDir))
    .then(buildStyles.bind(null, buildDir))
    .then(buildScripts.bind(null, buildDir))
    .then(buildHtml.bind(null, buildDir))
    .then(copyTempToBuild.bind(null, buildDir));
}

function createTemp() {
  var deferred = q.defer();

  gulp.src(SRC_DIR + "**/*")
    .pipe(gulp.dest(TEMP_DIR))
    .on("end", deferred.resolve);

  return deferred.promise;
}

function copyVendor(buildDir) {
  var deferred = q.defer();

  gulp.src([ BOWER_DIR + "angular/angular.js", BOWER_DIR + "jquery/dist/jquery.js" ])
    .pipe(concat("vendor.js"))
    .pipe(gulp.dest(TEMP_DIR + "scripts"))
    .on("end", deferred.resolve);

  return deferred.promise;
}

function buildStyles(buildDir) {
  var deferred = q.defer(),
      path = TEMP_DIR + "styles/**/*.less";

  gulp.src(path)
    .pipe(less())
    .pipe(minifyCss())
    .pipe(gulp.dest(buildDir + "styles"))
    .on("end", delAndResolve.bind(null, path, deferred));

  return deferred.promise;
}

function buildScripts(buildDir) {
  var deferred = q.defer(),
      path = TEMP_DIR + "scripts/**/*.js";

  gulp.src(path)
    .pipe(uglify())
    .pipe(gulp.dest(buildDir + "scripts"))
    .on("end", delAndResolve.bind(null, path, deferred));

  return deferred.promise;
}

function buildHtml(buildDir) {
  var deferred = q.defer(),
      path = TEMP_DIR + "**/*.html";

  gulp.src(path)
    .pipe(minifyHtml({
      conditionals: true,
      empty: true
    }))
    .pipe(gulp.dest(buildDir))
    .on("end", delAndResolve.bind(null, path, deferred));

  return deferred.promise;
}

function copyTempToBuild(buildDir) {
  var deferred = q.defer();

  gulp.src(TEMP_DIR + "**/*")
    .pipe(gulp.dest(buildDir))
    .on("end", deferred.resolve);

  return deferred.promise;
}

function delAndResolve(path, deferred) {
  del([path], deferred.resolve);
}

gulp.task("clean", function(cb) {
  del([ BUILD_DIR, BUILD_DEV_DIR, TEMP_DIR ], cb);
});