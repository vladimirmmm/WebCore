
module Article.Models {
    export class BaseArticle {
        public Id: string;
        public Title: string;
        public Content: string;
        public ImageUrl: string;
        public TypeName: string = "Article";

        public Category: Category;
    }
    export class Article extends BaseArticle {
        public Description: string;
        public Created: Date;
        public CategoryId: number;
        public CreatedByUserId: number;
        public Domain: string;
        public Url: string;
        public TypeName: string = "Article";
        public Files: FileObject[] = [];

    }
    export class Category {
        public Id: string;
        public Title: string;
        public Code: string;
        public ParentId: number;
        public TypeName: string = "AppCategory";
    }
}