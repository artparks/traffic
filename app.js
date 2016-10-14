/* deps */
const gm = require('gm');
const moment = require('moment');
const colors = require('colors');
const dir = require('node-dir');
const fs = require('fs');
const path = require('path');

/* config */
const srcPath = './src';
const threshold = 0.0009;
const suspectsPath = './suspects';
var movedCount = 0;

/* let's do this */
run();

/* run it! */
function run() {
    let outcome;
    let start = moment().format('x');
    let count = 0;

    // get an array of the input files and take the first one as the first comparison base
    getSrcFiles().then(files => {
        console.log(files);
        // return false;
        let lastFalse = files.shift();
        console.log(lastFalse);
        // return false;
        compare(files, lastFalse, count);
    }).catch(err => {
        console.error('oh shit!', err);
    });
}

/* get an array of input files */
function getSrcFiles() {
    return new Promise((resolve, reject) => {
        dir.paths(`${srcPath}/`, (err, files) => {
            if (err) reject(err);

            resolve(files.files.filter(file => {
                return file !== 'src/.DS_Store';
            }));
        });
    });
}

function compare(files, lastFalse, count, log = true) {
    if (!files.length) return false;

    count += 1;
    let nextToCheck = files.shift();

    gm.compare(lastFalse, nextToCheck, threshold, function (err, isEqual, equality, raw, path1, path2) {
        if (err) {
            console.log(err);
            return false;
        }

        if (log) {
            let color = isEqual ? 'green' : 'red';
            console.log('');
            console.log('- - - - - - - - - - - - - - - - - - - - - - - - - - -');
            console.log('files processed:', count);
            console.log('testing:', lastFalse, 'vs', nextToCheck);
            console.log('equal:', colors[color](isEqual));
            console.log('equality score:', equality);
            console.log('- - - - - - - - - - - - - - - - - - - - - - - - - - -');
            console.log('');
        }

        if (isEqual) {
            // not found a car, current check becomes lastFalse
            compare(files, nextToCheck, count);
        } else {
            // found a car, move nextToCheck to suspect dir, lastFalse remains the same
            if (moveSuspect(nextToCheck))
                compare(files, lastFalse, count);
        }
    });
}

/* move a suspect into the suspects directory */
function moveSuspect(suspect) {
    if (movedCount > 4)
        return false;

    movedCount += 1;
    let filename = path.basename(suspect);

    console.log(colors.red('** Moving suspect', filename, '**'));
    fs.renameSync(`${srcPath}/${filename}`, `${suspectsPath}/${filename}`);

    return true;
}