const gulp = require('gulp');
const fs = require('fs');
const cp = require('child_process');
const del = require('del');
const src = __dirname + '/src/';

function npmInstallRules() {
    return new Promise((resolve, reject) => {
        // Install node modules
        const cwd = src.replace(/\\/g, '/');

        const cmd = `npm install -f`;
        console.log(`"${cmd} in ${cwd}`);

        // System call used for update of js-controller itself,
        // because during installation npm packet will be deleted too, but some files must be loaded even during the install process.
        const exec = cp.exec;
        const child = exec(cmd, {cwd});

        child.stderr.pipe(process.stderr);
        child.stdout.pipe(process.stdout);

        child.on('exit', (code /* , signal */) => {
            // code 1 is strange error that cannot be explained. Everything is installed but error :(
            if (code && code !== 1) {
                reject('Cannot install: ' + code);
            } else {
                console.log(`"${cmd} in ${cwd} finished.`);
                // command succeeded
                resolve();
            }
        });
    });
}

function buildRules() {
    const version = JSON.parse(fs.readFileSync(__dirname + '/package.json').toString('utf8')).version;
    const data    = JSON.parse(fs.readFileSync(src + 'package.json').toString('utf8'));

    data.version = version;

    fs.writeFileSync(src + 'package.json', JSON.stringify(data, null, 4));

    return new Promise((resolve, reject) => {
        const options = {
            stdio: 'pipe',
            cwd: src
        };

        console.log(options.cwd);

        let script = src + 'node_modules/@craco/craco/bin/craco.js';
        if (!fs.existsSync(script)) {
            script = __dirname + '/node_modules/@craco/craco/bin/craco.js';
        }
        if (!fs.existsSync(script)) {
            console.error('Cannot find execution file: ' + script);
            reject('Cannot find execution file: ' + script);
        } else {
            const child = cp.fork(script, ['build'], options);
            child.stdout.on('data', data => console.log(data.toString()));
            child.stderr.on('data', data => console.log(data.toString()));
            child.on('close', code => {
                console.log(`child process exited with code ${code}`);
                code ? reject('Exit code: ' + code) : resolve();
            });
        }
    });
}

gulp.task('rules-0-clean', () => del(['admin/rules/**/*', 'src/build/**/*']));

gulp.task('rules-1-npm', async () => npmInstallRules());

gulp.task('rules-2-compile', async () => buildRules());

gulp.task('rules-3-copy', () => Promise.all([
    gulp.src(['src/build/*.js']).pipe(gulp.dest('admin/rules')),
    gulp.src(['src/build/*.map']).pipe(gulp.dest('admin/rules')),
    gulp.src(['src/build/asset-manifest.json']).pipe(gulp.dest('admin/rules')),
    gulp.src(['src/build/static/**/*']).pipe(gulp.dest('admin/rules/static')),
    gulp.src(['src/src/i18n/*.json']).pipe(gulp.dest('admin/rules/i18n')),
]));

gulp.task('rules-build', gulp.series(['rules-0-clean', 'rules-1-npm', 'rules-2-compile', 'rules-3-copy']));

const srcAdmin = __dirname + '/src-admin/';

function npmInstallAdmin() {
    return new Promise((resolve, reject) => {
        // Install node modules
        const cwd = srcAdmin.replace(/\\/g, '/');

        const cmd = `npm install -f`;
        console.log(`"${cmd} in ${cwd}`);

        // System call used for update of js-controller itself,
        // because during installation npm packet will be deleted too, but some files must be loaded even during the install process.
        const exec = cp.exec;
        const child = exec(cmd, {cwd});

        child.stderr.pipe(process.stderr);
        child.stdout.pipe(process.stdout);

        child.on('exit', (code /* , signal */) => {
            // code 1 is strange error that cannot be explained. Everything is installed but error :(
            if (code && code !== 1) {
                reject('Cannot install: ' + code);
            } else {
                console.log(`"${cmd} in ${cwd} finished.`);
                // command succeeded
                resolve();
            }
        });
    });
}

function buildAdmin() {
    const version = JSON.parse(fs.readFileSync(__dirname + '/package.json').toString('utf8')).version;
    const data    = JSON.parse(fs.readFileSync(srcAdmin + 'package.json').toString('utf8'));

    data.version = version;

    fs.writeFileSync(srcAdmin + 'package.json', JSON.stringify(data, null, 4));

    return new Promise((resolve, reject) => {
        const options = {
            stdio: 'pipe',
            cwd:   srcAdmin
        };

        console.log(options.cwd);

        let script = srcAdmin + 'node_modules/@craco/craco/bin/craco.js';
        if (!fs.existsSync(script)) {
            script = __dirname + '/node_modules/@craco/craco/bin/craco.js';
        }
        if (!fs.existsSync(script)) {
            console.error('Cannot find execution file: ' + script);
            reject('Cannot find execution file: ' + script);
        } else {
            const child = cp.fork(script, ['build'], options);
            child.stdout.on('data', data => console.log(data.toString()));
            child.stderr.on('data', data => console.log(data.toString()));
            child.on('close', code => {
                console.log(`child process exited with code ${code}`);
                code ? reject('Exit code: ' + code) : resolve();
            });
        }
    });
}

gulp.task('admin-0-clean', () => del([
    'admin/**/*',
    '!admin/telegram.png',
    '!admin/i18n/*',
    '!admin/blockly.js',
    '!admin/words.js',
    '!admin/jsonCustom.json',
    '!admin/jsonConfig.json',
    '!admin/rules/**/*',
    '!admin/rules/*',
    'src-admin/build/**/*']));

gulp.task('admin-1-npm', async () => npmInstallAdmin());
gulp.task('admin-2-compile', async () => buildAdmin());

gulp.task('admin-3-copy', () => Promise.all([
    gulp.src(['src-admin/build/static/js/*.js']).pipe(gulp.dest('admin/custom/static/js')),
    gulp.src(['src-admin/build/static/js/*.map']).pipe(gulp.dest('admin/custom/static/js')),
    gulp.src(['src-admin/build/customComponents.js']).pipe(gulp.dest('admin/custom')),
    gulp.src(['src-admin/build/customComponents.js.map']).pipe(gulp.dest('admin/custom')),
    gulp.src(['src-admin/src/i18n/*.json']).pipe(gulp.dest('admin/custom/i18n')),
]));

gulp.task('admin-build', gulp.series(['admin-0-clean', 'admin-1-npm', 'admin-2-compile', 'admin-3-copy']));

gulp.task('default', gulp.series(['rules-build', 'admin-build']));