const { readFileSync, readdirSync, existsSync } = require('fs')
const { join } = require('path')
const { transpileModule } = require('typescript')
const { minify } = require('uglify-es')
const { get, set } = require('lodash')
const tsconfig = require('../tsconfig.json')

const REG = {
    entry: /^(src\/[^\/]+\/index)\.html$/,
    import: /import[\s\t]*(.*from.*)?['"]([^'"]+)['"][\s\t\r\n]+/g,
    templateId: /([^\/]+)\/index\.(html|ts)$/,
    export: /([\r\n\s\t]+|^)export[\s]+default[\s]+/
}

const getTemplate = (modulePath) => {
    modulePath = modulePath.replace(/\.ts$/, '.html')
    if (!existsSync(modulePath)) {
        return ''
    }
    let moduleId = modulePath.match(REG.templateId)[1]
    let code = readFileSync(modulePath).toString()
    return `<template id="${moduleId}">
    ${code}
</template>
`
}
const hump = words => words.replace(/(^|\W+)([a-z])/g, (a, b, c) => c.toUpperCase())
const packCode = ({ modulePath, code }) => {
    let moduleId = modulePath.match(REG.templateId)
    code = code.replace(REG.import, '')
    if (moduleId && REG.export.test(code)) {
        let id = moduleId[1]
        let ClassName = hump(id)
        return `(function ($) {
            ${code.replace(/MODULE_ID/g, id).replace(REG.export, `$1const ${ClassName} = `)};
            customElements.define('${id}', ${ClassName}, ${ClassName}.option);
        })(wfQuery)`
    } else {
        return code
    }
}

const generate = ({ modulePath, build, root, callback = (() => { }) }) => {
    const filepath = join(root, modulePath + '.ts')
    let deps = [filepath]
    let txt = readFileSync(filepath).toString()
    let templates = getTemplate(filepath)
    let scripts = [{
        modulePath: filepath,
        code: readFileSync(filepath).toString()
    }]
    
    while (REG.import.test(txt)) {
        txt = txt.replace(REG.import, (all, from, m) => {
            const depPath = join(filepath.replace(/[^\/]+$/, ''), m + '.ts')
            if (deps.includes(depPath)) {
                return ''
            }
            deps.push(depPath)
            templates = getTemplate(depPath) + templates
            let code = !existsSync(depPath) ? '' : readFileSync(depPath).toString()
            scripts.unshift({
                modulePath: depPath,
                code
            })
            return code
        })
    }
    let scriptsOutput = transpileModule(
        scripts.map(packCode).join(';\n'),
        tsconfig
    ).outputText

    let wfquery = readFileSync(join(__dirname, '../node_modules/wfquery/wfQuery.js')).toString()
    if (build) {
        scriptsOutput = minify(scriptsOutput).code
        wfquery = minify(wfquery).code
    }

    deps.slice(1).map(d => callback && callback(d.replace(root, '')))
    return templates + `<script>${wfquery}${scriptsOutput}</script>`
}

module.exports = (conf) => {
    const {
        root,
        build
    } = conf

    let depsMap = {}

    return {
        onSet (pathname, data) {
            let m = pathname.match(REG.entry)
            if (m) {
                let ts = pathname.replace(/\.html$/, '\.ts')
                set(depsMap, [ts, pathname], 1)
                return generate({
                    build,
                    modulePath: m[1],
                    root,
                    callback: dep => set(depsMap, [dep, pathname], 1)
                })
            }
            if (pathname === 'index.html') {
                return readdirSync(join(root, './src')).filter(m => !/\./.test(m))
                    .map(m => `<a href="./src/${m}/demo.html">${m}</a>`).join('<br>')
                    + `<a href="https://github.com/shy2850/web-components" target="_"><img style="position: absolute; top: 0; right: 0; border: 0;" src="https://camo.githubusercontent.com/e7bbb0521b397edbd5fe43e7f760759336b5e05f/68747470733a2f2f73332e616d617a6f6e6177732e636f6d2f6769746875622f726962626f6e732f666f726b6d655f72696768745f677265656e5f3030373230302e706e67" alt="Fork me on GitHub" data-canonical-src="https://s3.amazonaws.com/github/ribbons/forkme_right_green_007200.png"></a>`
            }
        },
        buildWatcher (type, pathname, build) {
            let o = depsMap[pathname]
            if (o) {
                Object.keys(o).map(build)
            }
        }
    }

}