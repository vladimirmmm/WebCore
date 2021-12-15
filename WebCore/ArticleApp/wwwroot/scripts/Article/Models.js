var Article;
(function (Article_1) {
    var Models;
    (function (Models) {
        class BaseArticle {
            constructor() {
                this.TypeName = "Article";
            }
        }
        Models.BaseArticle = BaseArticle;
        class Article extends BaseArticle {
            constructor() {
                super(...arguments);
                this.TypeName = "Article";
                this.Files = [];
            }
        }
        Models.Article = Article;
        class Category {
            constructor() {
                this.TypeName = "AppCategory";
            }
        }
        Models.Category = Category;
    })(Models = Article_1.Models || (Article_1.Models = {}));
})(Article || (Article = {}));
//# sourceMappingURL=Models.js.map