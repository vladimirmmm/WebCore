module ErpApp.Model
{
    export class AppMessage {
        public Id: number;
        public CreatedOn: Date;
        public CreatedByUserId: string;
        public TargetUserId: string;
        public Subject: string;
        public Content: string;
        public FromName: string;
        public ToName: string;
        public ParentId: number;
        public IsReadByTarget: number;
        public TypeName: string = "AppMessage";
    }
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