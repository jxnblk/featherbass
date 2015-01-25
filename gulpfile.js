
var gulp = require('gulp');
var rename = require('gulp-rename');
var basswork = require('gulp-basswork');
var minifyCss = require('gulp-minify-css');
var webserver = require('gulp-webserver');
var s3 = require('gulp-s3');
var fs = require('fs');
var marked = require('marked');
var markedExample = require('marked-example');
var _ = require('lodash');
var cheerio = require('cheerio');


var renderer = new marked.Renderer();
renderer.code = markedExample({
  classes: {
    container: 'bg-darken-1 rounded',
    rendered: 'p2',
    code: 'p2 bg-darken-1'
  }
});


gulp.task('html', function() {
  var layout = fs.readFileSync('./templates/layout.html', 'utf8');
  var data = require('./package.json');
  var md = fs.readFileSync('./README.md', 'utf8');
  var content = marked(md, { renderer: renderer });
  var $ = cheerio.load(content);
  data.title = $.root().children().first('h1').html();
  $.root().children().first('h1').remove();
  $.root().children().first('p').remove();
  data.content = $.html();
  data.cdn = '//d2v52k3cl9vedd.cloudfront.net/featherbass/' + data.version + '/featherbass.min.css';
  var html = _.template(layout, data);
  fs.writeFileSync('./index.html', html);
});

gulp.task('s3', function() {
  var version = require('./package.json').version;
  var config = require('./aws.json');
  gulp.src('./css/*.css')
    .pipe(s3(config, {
      uploadPath: 'featherbass/' + version + '/'
    }));
});

gulp.task('css', function() {
  gulp.src('./src/featherbass.css')
    .pipe(basswork())
    .pipe(gulp.dest('./css'))
    .pipe(minifyCss())
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('./css'));
});

gulp.task('serve', function() {
  gulp.src('.')
    .pipe(webserver({}));
});

gulp.task('default', ['css', 'html', 'serve'], function() {
  gulp.watch(['./src/**/*', './README.md', './templates/**/*'], ['css', 'html']);
});

