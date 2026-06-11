const fs = require('fs');
const path = require('path');

// root
const rootDirectory = './CozyPixels-main'; 

function buildTwoDeepImageTree(rootDir) {
    const tree = {};

    // first layer
    const layer1Dirs = fs.readdirSync(rootDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    for (const folder1 of layer1Dirs) {
        const path1 = path.join(rootDir, folder1);
        tree[folder1] = {};

        // seccond layer
        const layer2Dirs = fs.readdirSync(path1, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        for (const folder2 of layer2Dirs) {
            const path2 = path.join(path1, folder2);

            // third layer
            const files = fs.readdirSync(path2, { withFileTypes: true })
                .filter(dirent => dirent.isFile())
                .map(dirent => dirent.name)
                // only keep images
                .filter(file => /\.(png|jpe?g|gif|webp)$/i.test(file));

            // only add imgs
            if (files.length > 0) {
                tree[folder1][folder2] = files;
            }
        }

        // get rid of weird file structures
        if (Object.keys(tree[folder1]).length === 0) {
            delete tree[folder1];
        }
    }

    return tree;
}

// Generate the object
const imageTree = buildTwoDeepImageTree(rootDirectory);

const outputContent = `const imageTree = ${JSON.stringify(imageTree, null, 4)};\n\n// If using modules, uncomment the line below:\n// export default imageTree;`;

fs.writeFileSync('./imageTree.js', outputContent, 'utf-8');

console.log('Successfully generated imageTree.js!');