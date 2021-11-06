// определеяем переменные с названиями папки входа и выхода==========================
let output_dir = "dist";
let entry_dir = "src";

// определяем папки для сборки=======================================================
// а именно в объекте указываем пути до папок и файлов, для удобства при дальнейших настройках
let path = {
  build: {
    html: output_dir + "/",
    css: output_dir + "/css/",
    js: output_dir + "/js/",
    images: output_dir + "/images_main/",
  },
  src: {
    //чтобы на выходе не получать все html включая шаблонные следует называть файлы шаблоны через _ (к примеру _header.html) и ставим исключение, чтобы такого рода файлы не попадали в итоговую сборку "!" + entry_dir + "/_*.html"
    html: [entry_dir + "/*.html", "!" + entry_dir + "/_*.html"],
    css: entry_dir + "/styles/franchize-page/index.scss",
    js: entry_dir + "/js/index.js",
    images: entry_dir + "/images_main/**/*.{jpg,svg,png, jpeg}",
  },
  watch: {
    //объект для отслеживания изменений в нижеперечисленных файлах
    html: entry_dir + "/**/*.html", //складывается в "src/любые папки/любые файлы с расширением html"
    css: entry_dir + "/styles/franchize-page/index.scss", //указываю конкретный файл css который прописываю в самом html еще перед сборкой
    js: entry_dir + "/js/**/*.js", //все файлы в любых папках с расширением js
    images: entry_dir + "/images/**/*.{jpg,svg,png}", //картинки с указанными форматами из всех вложенных папок либо из корневой папки
  },
  clean: "./" + output_dir + "/", //путь до папки итоговой сборки для функции очистки перед перзаписью новой сборки
};

//присваиваем функционал плагинов перменным ==========================================
let { src, dest } = require("gulp");
let gulp = require("gulp"); //непосредственно сам галп
let browsersync = require("browser-sync").create(); //для локального сервера
let fileinclude = require("gulp-file-include"); //сборка шаблонов html в один html
let del = require("del"); //функция удаления папки с точкой выходя при пересборке
let scss = require("gulp-sass")(require("node-sass")); //преобразование в css
let autoprefixer = require("gulp-autoprefixer"); //вендорные префиксы для кроссбраузерности
let group_media = require("gulp-group-css-media-queries"); //группировка медизапросов в конце сборки
let clean_css = require("gulp-clean-css");
let rename = require("gulp-rename");
let uglify = require("gulp-uglify-es").default;
let babel = require("gulp-babel");
let imagemin = require("gulp-imagemin");

// Запуск локального сервера на порте 3000
function browserSync(params) {
  browsersync.init({
    server: {
      baseDir: "./" + output_dir + "/", //указываем папку где надо искать index.html
    },
    port: 3000, //номер порта
    notify: false, //без уведомлений о запуске
  });
}

//==================================Сборка HTML (сборка блоков в один HTML через @@include('header.html'), непосредственно создание папки с собранным HTML, отслеживание )--------------
function html() {
  return src(path.src.html)
    .pipe(fileinclude())
    .pipe(dest(path.build.html))
    .pipe(browsersync.stream());
}

//==================================сборка SCSS в CSS---------------
function css() {
  return src(path.src.css)
    .pipe(
      scss({
        outputStyle: "expanded", // по умолчанию gulp-sass будет собирать scss в сжатом виде, прописывая expanded мы переключим режим сборки на расширенный режим, то бишь без сжатия.
      })
    )
    .pipe(group_media())
    .pipe(
      autoprefixer({
        overrideBrowserslist: ["last 5 version"], //вендорные префиксы для последних 5 версий всех браузеров
        cascade: true,
      })
    )
    .pipe(dest(path.build.css)) //читаемый вариант перед сжатием выгружаем
    .pipe(clean_css()) //сжимаем
    .pipe(
      rename({
        extname: ".min.css", //сжатый вариант
      })
    )
    .pipe(dest(path.build.css)) //с помощью функции dest указываем название папки в который на выходе будет помещен файл css
    .pipe(browsersync.stream()); //перезапуск локального сервера
}

//======================================сборка JS==============================
function js() {
  return src(path.src.js)
    .pipe(fileinclude())
    .pipe(dest(path.build.js))

    .pipe(uglify())
    .pipe(
      babel({
        presets: ["@babel/env"],
      })
    )
    .pipe(
      rename({
        extname: ".min.js", //сжатый вариант
      })
    )
    .pipe(dest(path.build.js))
    .pipe(browsersync.stream());
}

//====================================Сборка images===============================
function images() {
  return src(path.src.images)
    .pipe(
      imagemin({
        progressive: true,
        svgoPlugins: [{ removeViewBox: false }],
        interlaced: true,
        optimizationLevel: 3,
      })
    )
    .pipe(dest(path.build.images))
    .pipe(browsersync.stream());
}

//функция удаления папки dest перед очередной сборкой
function clean(params) {
  return del(path.clean);
}

//Отслеживание изменений в указанных файлах
function watchFiles(params) {
  gulp.watch([path.watch.html], html);
  gulp.watch([path.watch.css], css);
  gulp.watch([path.watch.js], js);
  gulp.watch([path.watch.images], images);
}
//=====================================================================================
//переменные для запуска gulp с их использованием (gulp build, gulp watch)=============
let build = gulp.series(clean, gulp.parallel(js, css, html, images));
let watch = gulp.parallel(build, watchFiles, browserSync);

//=====================================================================================
//Для того чтобы Gulp мог гользоваться данными функциями при сборке их нужно экспортировать
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;
