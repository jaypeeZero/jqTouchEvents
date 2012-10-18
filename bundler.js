var fs = require('fs'),
    parser = require('uglify-js').parser,
    uglifyer = require('uglify-js').uglify;

var scripts = [ 'jquery', 'events'];
    
var bundle = '';
scripts.forEach(function(file) {  
    bundle += "\n/**\n* " + file + ".js\n*/\n\n" + fs.readFileSync(__dirname + "/" + file + '.js') + "\n\n";
});

var ast = parser.parse(bundle);
ast = uglifyer.ast_mangle(ast);
ast = uglifyer.ast_squeeze(ast);
bundle = uglifyer.gen_code(ast);

fs.writeFileSync(__dirname + '/jquery.touch.events.min.js', bundle, 'utf8');