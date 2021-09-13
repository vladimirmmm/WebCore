module Language {
    export class Operator {
        public Parameters: number = 1;
        public Value: string;
    }
    export class Part {
        public Content: string;
        public Type: string;
        public Children: Part[] = [];
    }
    export class CallStatement extends Part {

    }
    export class Assignment extends Part {

    }
    export class Variable extends Part {

    }
    export class Block extends Part {
        public Signature: string;
    } 

    export class Loop extends Block {

    }
    export class Decision extends Part {

    }
    export class Declaration extends Part {

    }
    export class Function extends Block {

    }
    export class Procedure extends Function {

    }
    export class Trigger extends Function {

    }

    export class Statement {

    }
    export class Address {
        public Alias: string;
        public Reference: string;

    }
    export class Query extends Part {
        public Select: Statement;
        public From: Statement;
        public Join: Statement;
        public Where: Statement;
        public GroupBy: Statement;
        public OrderBy: Statement;
        public Skip: number;
        public Take: number;
    }
    export class View extends Query {

    }
    export class Table extends Part {

    }
    export class List extends Part {

    }
    export class Literal extends Part {

    }

    export class Command extends Part {

    }
    export class Comment extends Part {

    }
    export class Parser {
        // comments
        // literals
        //  functions
        //  procedures
        // triggers
        //parse blocks
        // Signature 
        // Declaration
        // return
        public Parse(part: Part, parent?: Part): Part {

            return part;
        }

        public HandleComments(part: Part, parent?: Part): Part {
            var csix = part.Content.indexOf("/*");
            var ceix = 0;

            var comments = TextsBetween(part.Content, "/*", "*/", true);
            comments.forEach(c => {
                part.Content = Replace(part.Content, c, "");
            });

            var lines = part.Content.split("\r\n|\r|\n");
            lines = lines.Select(i => {
                var ix = i.indexOf("--");
                if (ix > -1) {
                    return i.substring(0, ix);
                } else {
                    return i;
                }
            })
            part.Content = lines.join("\n");
            return part;
        }

        public HandleLiterals(part: Part, literaldictionary: DictionaryOf<string>) {

        }

    }
}