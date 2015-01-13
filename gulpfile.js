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

gulp.task("prod", ["clean"], function() {
  build(BUILD_DIR);
});

gulp.task("default", ["clean"], function() {
  return build(BUILD_DEV_DIR)
    .then(function() {
      var deferred = q.defer();
      del([TEMP_DIR], deferred.resolve());
      return deferred.promise;
    });
});

gulp.task("build styles", buildStyles.bind(null, SRC_DIR, BUILD_DEV_DIR, false));
gulp.task("build scripts", buildScripts.bind(null, SRC_DIR, BUILD_DEV_DIR, false));
gulp.task("build html", buildHtml.bind(null, SRC_DIR, BUILD_DEV_DIR, false));

gulp.task("watch", ["default"], function() {
  gulp.watch(SRC_DIR + "styles/**/*.less", ["build styles"]);
  gulp.watch(SRC_DIR + "scripts/**/*.js", ["build scripts"]);
  gulp.watch(SRC_DIR + "**/*.html", ["build html"]);
});

function build(buildDir) {
  return createTemp()
    .then(copyVendor.bind(null, buildDir))
    .then(buildStyles.bind(null, TEMP_DIR, buildDir, true))
    .then(buildScripts.bind(null, TEMP_DIR, buildDir, true))
    .then(buildHtml.bind(null, TEMP_DIR, buildDir, true))
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

  gulp.src([
      BOWER_DIR + "angular/angular.js",
      BOWER_DIR + "jquery/dist/jquery.js",
      BOWER_DIR + "angular-route/angular-route.js",
      BOWER_DIR + "angular-resource/angular-resource.js"
    ])
    .pipe(concat("vendor.js"))
    .pipe(gulp.dest(TEMP_DIR + "scripts"))
    .on("end", deferred.resolve);

  return deferred.promise;
}

function buildStyles(fromDir, toDir, deleteOriginal) {
  var deferred = q.defer(),
      path = fromDir + "styles/**/*.less";

  gulp.src(path)
    .pipe(less())
    .pipe(minifyCss())
    .pipe(gulp.dest(toDir + "styles"))
    .on("end", (deleteOriginal) ? delAndResolve.bind(null, path, deferred) : deferred.resolve);

  return deferred.promise;
}

function buildScripts(fromDir, toDir, deleteOriginal) {
  var deferred = q.defer(),
      path = fromDir + "scripts/**/*.js";

  gulp.src(path)
    .pipe(uglify())
    .pipe(gulp.dest(toDir + "scripts"))
    .on("end", (deleteOriginal) ? delAndResolve.bind(null, path, deferred) : deferred.resolve);

  return deferred.promise;
}

function buildHtml(fromDir, toDir, deleteOriginal) {
  var deferred = q.defer(),
      path = fromDir + "**/*.html";

  gulp.src(path)
    .pipe(minifyHtml({
      conditionals: true,
      empty: true
    }))
    .pipe(gulp.dest(toDir))
    .on("end", (deleteOriginal) ? delAndResolve.bind(null, path, deferred) : deferred.resolve);

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