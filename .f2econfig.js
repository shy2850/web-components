const { argv } = process
const build = argv[argv.length - 1] === 'build'
module.exports = {
    livereload: !build,
    build,
    gzip: true,
    buildFilter: pathname => !pathname || /^(src|index\.html)(\/|$)/.test(pathname),
    middlewares: [
        {
            middleware: 'template',
            test: /^src\/index\.html?$/
        },
        require('./libs')
    ],
    output: require('path').join(__dirname, './com')
}
